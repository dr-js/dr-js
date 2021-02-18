import { resolve, dirname } from 'path'
import { createWriteStream, promises as fsAsync } from 'fs'
import { start as startREPL } from 'repl'

import { percent, time, binary, prettyStringifyJSON } from 'source/common/format'
import { createStepper } from 'source/common/time'
import { isBasicObject } from 'source/common/check'
import { basicArray } from 'source/common/verify'
import { throttle } from 'source/common/function'

import { writeBufferToStreamAsync, quickRunletFromStream } from 'source/node/data/Stream'
import { configurePid } from 'source/node/module/Pid'
import { fetchWithJump } from 'source/node/net'

// HACK: add `@dr-js/core` to internal `modulePaths` to allow require
// code: https://github.com/nodejs/node/blob/v12.11.1/lib/internal/modules/cjs/loader.js#L620
//   > $ dr-js -e "console.log(module.filename)"
//   >   .../npm/node_modules/@dr-js/core/bin/function.js
//   > $ npx @dr-js/core -e "console.log(module.filename)"
//   >   .../.npm/_npx/####/lib/node_modules/@dr-js/core/bin/function.js
// and:
//   `.../npm/node_modules/@dr-js/*/bin/function.js` + `../../../../` = `.../npm/node_modules/` // allow this and related module to resolve
//   `.../.npm/_npx/####/lib/node_modules/@dr-js/*/bin/function.js` + `../../../../` = `.../.npm/_npx/####/lib/node_modules/` // allow this and related module to resolve
// NOTE:
//   currently for the `output-gitignore` code, output of `require('@dr-js/core/package').version` will be
//   the version from `./node_modules/@dr-js/core/package.json`, since it's higher in the path list,
//   and the '../../../../' will result in an invalid path
const modulePathHack = (newPath) => {
  if (!newPath.endsWith('node_modules')) return // keep only valid paths
  const modulePaths = require('module')._resolveLookupPaths('modulePaths') // list of path to look for global node_modules, check the value of `module.paths` in repl
  basicArray(modulePaths)
  if (!modulePaths.includes(newPath)) modulePaths.push(newPath)
}
const patchModulePath = () => modulePathHack(resolve(module.filename, '../../../../'))

const evalScript = ( // NOTE: use eval not Function to derive local
  evalScriptString, // inputFile ? String(readFileSync(inputFile)) : argumentList[ 0 ]
  evalScriptPath, // inputFile || resolve('__SCRIPT_STRING__'),
  evalArgv, // inputFile ? argumentList : argumentList.slice(1)
  evalOption // optionData
) => eval(`async (evalArgv, evalOption, __filename, __dirname, require) => { ${evalScriptString} }`)( // eslint-disable-line no-eval
  evalArgv, // NOTE: allow both evalArgv / argumentList is accessible from eval
  evalOption,
  evalScriptPath,
  dirname(evalScriptPath),
  require('module').createRequire(evalScriptPath)
)

const stepper = createStepper()
const logAuto = (...args) => console.log(
  ...((args.length === 1 && isBasicObject(args[ 0 ]))
    ? [ JSON.stringify(args[ 0 ], null, 2) ]
    : args),
  `(+${time(stepper())})`
)

const sharedOption = async (optionData, modeName) => {
  const { tryGet, tryGetFirst, getToggle } = optionData

  const log = getToggle('quiet') ? () => {} : logAuto

  const argumentList = tryGet(modeName) || []
  const inputFile = tryGetFirst('input-file')
  const outputFile = tryGetFirst('output-file')

  await configurePid({ filePid: tryGetFirst('pid-file') })

  const toBuffer = (value) => Buffer.isBuffer(value) ? value
    : isBasicObject(value) ? JSON.stringify(value, null, 2)
      : Buffer.from(value) // should be String
  const outputValueAuto = async (value) => outputFile
    ? fsAsync.writeFile(outputFile, toBuffer(value))
    : writeBufferToStreamAsync(process.stdout, toBuffer(value))
  const outputStream = (stream) => quickRunletFromStream(
    stream,
    outputFile ? createWriteStream(outputFile) : process.stdout
  )

  return { // sharedPack
    optionData, modeName,
    argumentList, log, inputFile, outputFile, outputValueAuto, outputStream
  }
}

const sharedMode = async ({ // NOTE: for `@dr-js/node` to reuse & extend
  // sharedPack
  optionData, modeName,
  argumentList, log, inputFile, outputValueAuto, outputStream,

  // patchModulePath overwrite, so more patch path can be added
  patchMP = patchModulePath,

  // fetch overwrite for `@dr-js/node` to add http-proxy support
  fetchUserAgent, fetchExtraOption, // TODO: DEPRECATE: use below option
  fetchWJ = fetchWithJump, fetchUA = fetchUserAgent
}) => {
  switch (modeName) {
    case 'eval': {
      await patchMP()
      const result = await evalScript(
        inputFile ? String(await fsAsync.readFile(inputFile)) : argumentList[ 0 ],
        inputFile || resolve('__SCRIPT_STRING__'),
        inputFile ? argumentList : argumentList.slice(1),
        optionData
      )
      return result !== undefined && outputValueAuto(result)
    }
    case 'repl':
      await patchMP()
      return startREPL({ useGlobal: true }) // NOTE: need manual Ctrl+C

    case 'fetch': {
      let [ initialUrl, method = 'GET', jumpMax = 4, timeout = 0 ] = argumentList
      jumpMax = Number(jumpMax) || 0 // 0 for no jump, use 'Infinity' for unlimited jump
      timeout = Number(timeout) || 0 // in msec, 0 for unlimited
      const body = inputFile ? await fsAsync.readFile(inputFile) : null
      let isDone = false
      const response = await fetchWJ(initialUrl, {
        method, timeout, jumpMax, body,
        headers: { 'accept': '*/*', 'user-agent': fetchUA }, // patch for sites require a UA, like GitHub
        onProgressUpload: throttle((now, total) => isDone || log(`[fetch-upload] ${percent(now / total)} (${binary(now)}B / ${binary(total)}B)`), 1000),
        onProgressDownload: throttle((now, total) => isDone || log(`[fetch-download] ${percent(now / total)} (${binary(now)}B / ${binary(total)}B)`), 1000),
        preFetch: (url, jumpCount, cookieList) => log(`[fetch] <${method}>${url}, jump: ${jumpCount}/${jumpMax}, timeout: ${timeout ? time(timeout) : 'none'}, cookie: ${cookieList.length}`),
        ...fetchExtraOption
      })
      if (!response.ok) throw new Error(`bad status: ${response.status}`)
      const contentLength = Number(response.headers[ 'content-length' ])
      log(`[fetch] status: ${response.status}, header: ${prettyStringifyJSON(response.headers)}`)
      log(`[fetch] fetch response content${contentLength ? ` (${binary(contentLength)}B)` : ''}...`)
      await outputStream(response.stream())
      isDone = true
      return log('\n[fetch] done')
    }
  }
}

const runMain = (mainFunc, ...argv) => { // NOTE: convenient to use with --eval
  const stepper = createStepper()
  Promise.resolve(mainFunc(...argv)).then(
    () => console.log(`done ${time(stepper())}`),
    (error) => {
      console.error(error)
      process.exitCode = 1
    }
  )
}

export { // NOTE: only borrow script from here for test or for another bin/script, will cause bloat if webpack pull code from both module/library
  modulePathHack, patchModulePath,
  evalScript,

  logAuto,
  sharedOption, sharedMode,

  runMain
}
