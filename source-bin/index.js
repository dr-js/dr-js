#!/usr/bin/env node

import { cpus } from 'os'
import { resolve, normalize } from 'path'
import { createReadStream, createWriteStream, readFileSync, writeFileSync } from 'fs'
import { start as startREPL } from 'repl'

import { getEndianness } from '@dr-js/core/module/env/function'

import { time, binary, prettyStringifyJSON } from '@dr-js/core/module/common/format'
import { indentList } from '@dr-js/core/module/common/string'
import { setTimeoutAsync } from '@dr-js/core/module/common/time'
import { isBasicObject, isBasicFunction } from '@dr-js/core/module/common/check'

import { pipeStreamAsync, bufferToReadableStream } from '@dr-js/core/module/node/data/Stream'
import { createDirectory } from '@dr-js/core/module/node/file/Directory'
import { modifyMove, modifyCopy, modifyDelete } from '@dr-js/core/module/node/file/Modify'
import { autoTestServerPort } from '@dr-js/core/module/node/server/function'
import { createServerPack } from '@dr-js/core/module/node/server/Server'
import { createTCPProxyListener } from '@dr-js/core/module/node/server/Proxy'
import { getDefaultOpen } from '@dr-js/core/module/node/system/DefaultOpen'
import { runSync } from '@dr-js/core/module/node/system/Run'
import { getAllProcessStatusAsync, describeAllProcessStatusAsync } from '@dr-js/core/module/node/system/Process'
import { getSystemStatus, describeSystemStatus } from '@dr-js/core/module/node/system/Status'
import { fetchWithJump } from '@dr-js/core/module/node/net'

import { commonStartServer, configure as configureServerTestConnection } from './server/testConnection'
import { configure as configureServerServeStatic } from './server/serveStatic'
import { configure as configureServerWebSocketGroup } from './server/websocketGroup'

import { modulePathHack, evalScript } from './function'
import { MODE_NAME_LIST, parseOption, formatUsage } from './option'

import { name as packageName, version as packageVersion } from '../package.json'

const logAuto = (value) => console.log(isBasicObject(value)
  ? JSON.stringify(value, null, 2)
  : value
)

const getVersion = () => ({
  packageName,
  packageVersion,
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch,
  endianness: getEndianness(),
  cpuCount: (cpus() || [ 'TERMUX FIX' ]).length // TODO: fix Termux, check: https://github.com/termux/termux-app/issues/299
})

const runMode = async (modeName, optionData) => {
  const { tryGet, tryGetFirst } = optionData
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

  // for ipv6 should use host like: `[::]:80`
  const parseHost = (host, defaultHostname) => {
    const hostnameList = host.split(':')
    const port = Number(hostnameList.pop())
    const hostname = hostnameList.join(':') || defaultHostname
    return { hostname, port }
  }
  const getServerPack = async (protocol = 'http:') => {
    const { hostname, port } = parseHost(tryGetFirst('host') || '', '0.0.0.0')
    return createServerPack({
      protocol,
      hostname,
      port: port || await autoTestServerPort([ 80, 8080, 8888, 8800, 8000 ], hostname) // for more stable port
    })
  }
  const startServer = async (configureFunc, option) => {
    const serverPack = await getServerPack()
    return commonStartServer({ serverPack, log, ...configureFunc({ serverPack, log, ...option }) })
  }

  switch (modeName) {
    case 'eval': {
      modulePathHack()
      const result = await evalScript(
        inputFile ? String(readFileSync(inputFile)) : argumentList[ 0 ],
        inputFile || resolve(process.cwd(), '__SCRIPT_STRING__'),
        inputFile ? argumentList : argumentList.slice(1),
        optionData
      )
      return result !== undefined && outputBuffer(Buffer.isBuffer(result) ? result : Buffer.from(String(result)))
    }
    case 'repl':
      modulePathHack()
      return startREPL({ useGlobal: true })

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
    case 'merge': {
      const [ mergedFile, ...fileList ] = argumentList
      for (const path of fileList) await pipeStreamAsync(createWriteStream(mergedFile, { flags: 'a' }), createReadStream(path))
      return
    }

    case 'open': {
      const uri = argumentList[ 0 ] || '.' // can be url or path
      return runSync({ command: getDefaultOpen(), argList: [ uri.includes('://') ? uri : normalize(uri) ], option: { shell: true } })
    }
    case 'status':
      return logAuto(isOutputJSON ? getSystemStatus() : describeSystemStatus())

    case 'create-directory':
      for (const path of argumentList) await logTaskResult(createDirectory, path)
      return
    case 'modify-copy':
      return modifyCopy(argumentList[ 0 ], argumentList[ 1 ])
    case 'modify-move':
      return modifyMove(argumentList[ 0 ], argumentList[ 1 ])
    case 'modify-delete':
      for (const path of argumentList) await logTaskResult(modifyDelete, path)
      return

    case 'fetch': {
      let [ initialUrl, jumpMax = 4, timeout = 0 ] = argumentList
      jumpMax = Number(jumpMax) || 0 // 0 for no jump, use 'Infinity' for unlimited jump
      timeout = Number(timeout) || 0 // in msec, 0 for unlimited
      const response = await fetchWithJump(initialUrl, {
        headers: { 'accept': '*/*', 'user-agent': `${packageName}/${packageVersion}` },
        timeout,
        jumpMax,
        preFetch: (url, jumpCount, cookieList) => log(`[fetch] url: ${url}, jump: ${jumpCount}/${jumpMax}, timeout: ${timeout ? time(timeout) : 'none'}, cookie: ${cookieList.length}`)
      })
      if (!response.ok) throw new Error(`bad status: ${response.status}`)
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
      return writeFileSync(outputFile || inputFile, prettyStringifyJSON(JSON.parse(readFileSync(inputFile)), unfoldLevel))
    }

    case 'server-serve-static':
    case 'server-serve-static-simple': {
      const [ expireTime = 5 * 1000 ] = argumentList // expireTime: 5sec, in msec
      const staticRoot = tryGetFirst('root') || process.cwd()
      return startServer(configureServerServeStatic, { isSimpleServe: modeName === 'server-serve-static-simple', expireTime: Number(expireTime), staticRoot })
    }
    case 'server-websocket-group':
      return startServer(configureServerWebSocketGroup)
    case 'server-test-connection':
      return startServer(configureServerTestConnection)
    case 'server-tcp-proxy': {
      let targetOptionList
      let getTargetOption
      if (!isBasicFunction(argumentList[ 0 ])) {
        targetOptionList = argumentList.map((host) => parseHost(host, '127.0.0.1'))
        let targetOptionIndex = 0 // selected in round robin order
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
      const { server, option, start } = await getServerPack('tcp:')
      server.on('connection', createTCPProxyListener({ getTargetOption }))
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
  if (optionData.tryGet('version')) return logAuto(getVersion())
  if (optionData.tryGet('help')) return logAuto(formatUsage())
  const modeName = MODE_NAME_LIST.find((name) => optionData.tryGet(name))
  if (!modeName) throw new Error('no mode specified')
  await runMode(modeName, optionData).catch((error) => {
    console.warn(`[Error] in mode: ${modeName}: ${error.stack || error}`)
    process.exit(2)
  })
}

main().catch((error) => {
  console.warn(formatUsage(error.stack || error, 'simple'))
  process.exit(1)
})
