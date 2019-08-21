#!/usr/bin/env node

import { normalize, dirname } from 'path'
import { createReadStream, createWriteStream, readFileSync, writeFileSync } from 'fs'
import { start as startREPL } from 'repl'

import { time, binary, prettyStringifyJSON } from 'dr-js/module/common/format'
import { indentList } from 'dr-js/module/common/string'
import { setTimeoutAsync } from 'dr-js/module/common/time'
import { isBasicObject, isBasicFunction } from 'dr-js/module/common/check'

import { pipeStreamAsync, bufferToReadableStream } from 'dr-js/module/node/data/Stream'
import { createDirectory } from 'dr-js/module/node/file/Directory'
import { modifyMove, modifyCopy, modifyDelete } from 'dr-js/module/node/file/Modify'
import { autoTestServerPort } from 'dr-js/module/node/server/function'
import { createTCPProxyServer } from 'dr-js/module/node/server/TCPProxyServer'
import { getDefaultOpen } from 'dr-js/module/node/system/DefaultOpen'
import { runSync } from 'dr-js/module/node/system/Run'
import { getAllProcessStatusAsync, describeAllProcessStatusAsync } from 'dr-js/module/node/system/Process'
import { getSystemStatus, describeSystemStatus } from 'dr-js/module/node/system/Status'

import { startServerServeStatic } from './server/serveStatic'
import { startServerWebSocketGroup } from './server/websocketGroup'
import { startServerTestConnection } from './server/testConnection'

import { packageName, packageVersion, getVersion, evalScript, evalReadlineExtend, fetchWithJump, collectFile } from './function'
import { MODE_NAME_LIST, parseOption, formatUsage } from './option'

const logAuto = (value) => console.log(isBasicObject(value)
  ? JSON.stringify(value, null, 2)
  : value
)

const runMode = async (modeName, optionData) => {
  const { tryGet, tryGetFirst, getFirst } = optionData
  const log = tryGet('quiet')
    ? () => {}
    : console.log
  const logTaskResult = (task, path) => task(path).then(
    () => log(`[${modeName}] done: ${path}`),
    (error) => log(`[${modeName}] error: ${path}\n${error.stack || error}`)
  )

  const argumentList = tryGet(modeName) || []
  const isOutputJSON = Boolean(tryGet('json'))
  const inputFile = tryGetFirst('input-file')
  const outputFile = tryGetFirst('output-file')
  const outputBuffer = (buffer) => outputFile
    ? writeFileSync(outputFile, buffer)
    : pipeStreamAsync(process.stdout, bufferToReadableStream(buffer))
  const outputStream = (stream) => pipeStreamAsync(
    outputFile ? createWriteStream(outputFile) : process.stdout,
    stream
  )

  const getServerConfig = async () => {
    const hostPair = (tryGetFirst('host') || '').split(':')
    const hostname = hostPair[ 0 ] || '0.0.0.0'
    const port = Number(hostPair[ 1 ] || await autoTestServerPort([ 80, 8080, 8888, 8800, 8000 ], hostname)) // for more stable port
    return { hostname, port }
  }

  switch (modeName) {
    case 'eval':
    case 'eval-readline': {
      let result = await evalScript(
        inputFile ? String(readFileSync(inputFile)) : argumentList[ 0 ],
        inputFile ? argumentList : argumentList.slice(1),
        inputFile ? dirname(inputFile) : process.cwd(),
        optionData
      )
      if (modeName === 'eval-readline') result = await evalReadlineExtend(result, getFirst('root'), log)
      return result !== undefined && outputBuffer((result instanceof Buffer)
        ? result
        : Buffer.from(String(result)))
    }
    case 'repl':
      return (startREPL({ prompt: '> ', input: process.stdin, output: process.stdout, useGlobal: true }).context.require = require)

    case 'wait': {
      const waitTime = argumentList[ 0 ] || 2 * 1000
      return setTimeoutAsync(waitTime)
    }
    case 'echo':
      return logAuto(argumentList)
    case 'cat': {
      if (argumentList.length) for (const path of argumentList) await pipeStreamAsync(process.stdout, createReadStream(path))
      else if (!process.stdin.isTTY) await pipeStreamAsync(process.stdout, process.stdin)
      return
    }
    case 'write':
    case 'append':
      if (process.stdin.isTTY) throw new Error('unsupported TTY stdin') // teletypewriter(TTY)
      const flags = modeName === 'write' ? 'w' : 'a'
      return pipeStreamAsync(createWriteStream(argumentList[ 0 ], { flags }), process.stdin)
    case 'open': {
      const uri = argumentList[ 0 ] || '.' // can be url or path
      return runSync({ command: getDefaultOpen(), argList: [ uri.includes('://') ? uri : normalize(uri) ] })
    }
    case 'status':
      return logAuto(isOutputJSON ? getSystemStatus() : describeSystemStatus())

    case 'file-list':
    case 'file-list-all':
    case 'file-tree':
      return logAuto(await collectFile(modeName, argumentList[ 0 ] || process.cwd()))
    case 'file-create-directory':
      for (const path of argumentList) await logTaskResult(createDirectory, path)
      return
    case 'file-modify-copy':
      return modifyCopy(argumentList[ 0 ], argumentList[ 1 ])
    case 'file-modify-move':
      return modifyMove(argumentList[ 0 ], argumentList[ 1 ])
    case 'file-modify-delete':
      for (const path of argumentList) await logTaskResult(modifyDelete, path)
      return
    case 'file-merge': {
      const [ mergedFile, ...fileList ] = argumentList
      for (const path of fileList) await pipeStreamAsync(createWriteStream(mergedFile, { flags: 'a' }), createReadStream(path))
      return
    }

    case 'fetch': {
      let [ initialUrl, jumpMax = 4, timeout = 0 ] = argumentList
      jumpMax = Number(jumpMax) || 0 // 0 for no jump, use 'Infinity' for unlimited jump
      timeout = Number(timeout) || 0 // in msec, 0 for unlimited
      const response = await fetchWithJump(
        initialUrl,
        { headers: { 'accept': '*/*', 'user-agent': `${packageName}/${packageVersion}` }, timeout },
        jumpMax,
        (url, jumpCount, cookieList) => log(`[fetch] url: ${url}, jump: ${jumpCount}/${jumpMax}, timeout: ${timeout ? time(timeout) : 'none'}, cookie: ${cookieList.length}`)
      )
      const contentLength = Number(response.headers[ 'content-length' ])
      log(`[fetch] get status: ${response.status}, fetch response content${contentLength ? ` (${binary(contentLength)}B)` : ''}...`)
      await outputStream(response.stream())
      return log(`\n[fetch] done`)
    }
    case 'process-status': {
      const [ outputMode = 'pid--' ] = argumentList
      return logAuto(await (isOutputJSON ? getAllProcessStatusAsync : describeAllProcessStatusAsync)(outputMode))
    }
    case 'json-format': {
      const [ unfoldLevel = 2 ] = argumentList
      const inputJSON = JSON.parse(readFileSync(inputFile))
      const outputJSONString = prettyStringifyJSON(inputJSON, unfoldLevel)
      return writeFileSync(outputFile || inputFile, outputJSONString)
    }

    case 'server-serve-static':
    case 'server-serve-static-simple': {
      const [ expireTime = 5 * 1000 ] = argumentList // expireTime: 5sec, in msec
      const isSimpleServe = modeName === 'server-serve-static-simple'
      const staticRoot = tryGetFirst('root') || process.cwd()
      return startServerServeStatic({ isSimpleServe, expireTime: Number(expireTime), staticRoot, log, ...(await getServerConfig()) })
    }
    case 'server-websocket-group':
      return startServerWebSocketGroup({ log, ...(await getServerConfig()) })
    case 'server-test-connection':
      return startServerTestConnection({ log, ...(await getServerConfig()) })
    case 'server-tcp-proxy': {
      let targetOptionList
      let getTargetOption
      if (!isBasicFunction(argumentList[ 0 ])) {
        targetOptionList = argumentList.map((host) => {
          const [ hostname, port ] = host.split(':')
          return { hostname: hostname || 'localhost', port: Number(port) }
        })
        let targetOptionIndex = 0
        getTargetOption = (socket) => {
          targetOptionIndex = (targetOptionIndex + 1) % targetOptionList.length
          const targetOption = targetOptionList[ targetOptionIndex ]
          log(`[CONNECT] ${socket.remoteAddress}:${socket.remotePort} => ${targetOption.hostname}:${targetOption.port}`)
          return targetOption
        }
      } else {
        targetOptionList = [ { hostname: 'custom-hostname', port: 'custom-port' } ]
        getTargetOption = argumentList[ 0 ]
      }
      const { option, start } = createTCPProxyServer({ getTargetOption, ...(await getServerConfig()) })
      await start()
      return log(indentList('[TCPProxy]', [
        `pid: ${process.pid}`,
        `at: ${option.hostname}:${option.port}`,
        ...targetOptionList.map((option) => `proxy to: ${option.hostname}:${option.port}`)
      ]))
    }
  }
}

const main = async () => {
  const optionData = await parseOption()
  const modeName = MODE_NAME_LIST.find((name) => optionData.tryGet(name))

  if (!modeName) {
    return logAuto(optionData.tryGet('version')
      ? getVersion()
      : formatUsage(null, optionData.tryGet('help') ? null : 'simple')
    )
  }

  await runMode(modeName, optionData).catch((error) => {
    console.warn(`[Error] in mode: ${modeName}:`, error.stack || error)
    process.exit(2)
  })
}

main().catch((error) => {
  console.warn(formatUsage(error.stack || error, 'simple'))
  process.exit(1)
})
