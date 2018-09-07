#!/usr/bin/env node

import { cpus } from 'os'
import { normalize } from 'path'
import { createReadStream, createWriteStream, readFileSync, writeFileSync } from 'fs'
import { start as startREPL } from 'repl'

import { getEndianness } from 'dr-js/module/env/function'

import { time, binary } from 'dr-js/module/common/format'

import { fetch } from 'dr-js/module/node/net'
import { pipeStreamAsync, bufferToStream } from 'dr-js/module/node/data/Stream'
import { createDirectory } from 'dr-js/module/node/file/File'
import { getFileList, getDirectorySubInfoList } from 'dr-js/module/node/file/Directory'
import { modify } from 'dr-js/module/node/file/Modify'
import { getDefaultOpen } from 'dr-js/module/node/system/DefaultOpen'
import { runSync } from 'dr-js/module/node/system/Run'
import { getSystemStatus, getProcessStatus, describeSystemStatus } from 'dr-js/module/node/system/Status'
import { autoTestServerPort } from 'dr-js/module/node/server/function'

import { MODE_FORMAT_LIST, parseOption, formatUsage } from './option'
import { createServerTestConnection } from './server/testConnection'
import { createServerServeStatic } from './server/serveStatic'
import { createServerWebSocketGroup } from './server/websocketGroup'
import { createServerCacheHttpProxy } from './server/cacheHttpProxy'

import { name as packageName, version as packageVersion } from '../package.json'

const runMode = async (modeFormat, { optionMap, getOption, getOptionOptional, getSingleOption, getSingleOptionOptional }) => {
  const log = getOptionOptional('quiet')
    ? () => {}
    : console.log
  const logTaskResult = (task, path) => task(path).then(
    () => log(`[${modeFormat.name}] done: ${path}`),
    (error) => log(`[${modeFormat.name}] error: ${path}\n${error.stack || error}`)
  )

  const isHumanReadableOutput = Boolean(getOptionOptional('help'))
  const argumentList = getOptionOptional(modeFormat.name) || []
  const inputFile = getSingleOptionOptional('input-file')
  const outputFile = getSingleOptionOptional('output-file')
  const outputBuffer = (buffer) => outputFile
    ? writeFileSync(outputFile, buffer)
    : pipeStreamAsync(process.stdout, bufferToStream(buffer))

  const getServerConfig = async () => {
    const hostname = getSingleOptionOptional('hostname') || '0.0.0.0'
    const port = getSingleOptionOptional('port') || await autoTestServerPort([ 80, 8080, 8888, 8800, 8000 ], hostname) // for more stable port
    return { hostname, port: Number(port) }
  }

  switch (modeFormat.name) {
    case 'eval': {
      global.evalArgv = inputFile ? argumentList : argumentList.slice(1) // NOTE: both global.evalArgv / argumentList is accessible from eval
      const result = await eval(String(inputFile ? readFileSync(inputFile).toString() : argumentList[ 0 ])) // eslint-disable-line no-eval
      return result !== undefined && outputBuffer(Buffer.from(String(result)))
    }
    case 'repl':
      return startREPL({ prompt: '> ', input: process.stdin, output: process.stdout, useGlobal: true })
    case 'echo':
      return logJSON(argumentList)
    case 'cat': {
      if (argumentList.length) for (const path of argumentList) await pipeStreamAsync(process.stdout, createReadStream(path))
      else if (!process.stdin.isTTY) await pipeStreamAsync(process.stdout, process.stdin)
      return
    }
    case 'write':
    case 'append':
      if (process.stdin.isTTY) throw new Error('[pipe] stdin should not be TTY mode') // teletypewriter(TTY)
      const flags = modeFormat.name === 'write' ? 'w' : 'a'
      return pipeStreamAsync(createWriteStream(argumentList[ 0 ] || process.cwd(), { flags }), process.stdin)
    case 'open': {
      const uri = argumentList[ 0 ] || '.' // can be url or path
      return runSync({ command: getDefaultOpen(), argList: [ uri.includes('://') ? uri : normalize(uri) ] })
    }
    case 'status':
      return isHumanReadableOutput
        ? console.log(describeSystemStatus())
        : logJSON({ system: getSystemStatus(), process: getProcessStatus() })
    case 'file-list':
      return logJSON(await getPathContent(argumentList[ 0 ] || process.cwd()))
    case 'file-list-all':
      return logJSON(await getFileList(argumentList[ 0 ] || process.cwd()))
    case 'file-create-directory':
      for (const path of argumentList) await logTaskResult(createDirectory, path)
      return
    case 'file-modify-copy':
      return modify.copy(argumentList[ 0 ], argumentList[ 1 ])
    case 'file-modify-move':
      return modify.move(argumentList[ 0 ], argumentList[ 1 ])
    case 'file-modify-delete':
      for (const path of argumentList) await logTaskResult(modify.delete, path)
      return
    case 'file-merge': {
      const [ mergedFile, ...fileList ] = argumentList
      for (const path of fileList) await pipeStreamAsync(createWriteStream(mergedFile, { flags: 'a' }), createReadStream(path))
      return
    }
    case 'fetch': {
      const [ initialUrl, jumpMaxString = '0', timeoutString = '0' ] = argumentList
      const jumpMax = Number(jumpMaxString) || 0
      const timeout = Number(timeoutString) || 0 // msec, 0 for none
      let jumpCount = 0
      let url = initialUrl
      let cookieList = []
      while (true) {
        log(`[fetch] url: ${url}, jump: ${jumpCount}/${jumpMax}, timeout: ${timeout ? time(timeout) : 'none'}, cookie: ${cookieList.length}`)
        const response = await fetch(url, { headers: { cookie: cookieList.join(';'), accept: '*/*' }, timeout })
        const getInfo = () => JSON.stringify({ url, status: response.status, headers: response.headers }, null, '  ')
        if (response.ok) {
          log(`[fetch] get status: ${response.status}, fetch response content (${binary(response.headers[ 'content-length' ])}B)...`)
          const buffer = await response.buffer()
          log(`[fetch] get content: ${binary(buffer.length)}B`)
          return outputBuffer(buffer)
        } else if (response.status >= 300 && response.status <= 399 && response.headers[ 'location' ]) {
          jumpCount++
          if (jumpCount > jumpMax) throw new Error(`[fetch] ${jumpMax} max jump reached: ${getInfo()}`)
          url = new URL(response.headers[ 'location' ], url)
          cookieList = [ ...cookieList, ...(response.headers[ 'set-cookie' ] || []).map((v) => v.split(';')[ 0 ]) ]
        } else throw new Error(`[fetch] bad status: ${getInfo()}`)
      }
    }
    case 'server-serve-static':
    case 'server-serve-static-simple': {
      const isSimpleServe = [ 'server-serve-static-simple', 'ssss' ].includes(modeFormat.name)
      const staticRoot = getSingleOptionOptional('root') || process.cwd()
      return createServerServeStatic({ isSimpleServe, staticRoot, log, ...(await getServerConfig()) })
    }
    case 'server-websocket-group':
      return createServerWebSocketGroup({ log, ...(await getServerConfig()) })
    case 'server-test-connection':
      return createServerTestConnection({ log, ...(await getServerConfig()) })
    case 'server-cache-http-proxy': {
      const [ remoteUrlPrefix, expireTime = 7 * 24 * 60 * 60 ] = getOption(modeFormat.name) // expireTime: 7days, in seconds
      const cachePath = getSingleOption('root')
      return createServerCacheHttpProxy({ remoteUrlPrefix, cachePath, expireTime: Number(expireTime), log, ...(await getServerConfig()) })
    }
  }
}

const logJSON = (object) => console.log(JSON.stringify(object, null, '  '))

const getVersion = () => ({
  packageName,
  packageVersion,
  platform: process.platform,
  nodeVersion: process.version,
  processorArchitecture: process.arch,
  processorEndianness: getEndianness(),
  processorCount: (cpus() || [ 'TERMUX FIX' ]).length // TODO: fix Termux, check: https://github.com/termux/termux-app/issues/299
})

const getPathContent = async (rootPath) => (await getDirectorySubInfoList(rootPath)).map( // single level deep
  ({ name, stat }) => stat.isDirectory()
    ? `${name}/`
    : name
)

const main = async () => {
  const optionData = await parseOption()
  const modeFormat = MODE_FORMAT_LIST.find(({ name }) => optionData.getOptionOptional(name))

  if (!modeFormat) {
    return optionData.getOptionOptional('version')
      ? logJSON(getVersion())
      : console.log(formatUsage(null, optionData.getOptionOptional('help') ? null : 'simple'))
  }

  await runMode(modeFormat, optionData).catch((error) => {
    console.warn(`[Error] in mode: ${modeFormat.name}:`, error.stack || error)
    process.exit(2)
  })
}

main().catch((error) => {
  console.warn(formatUsage(error.stack || error, 'simple'))
  process.exit(1)
})
