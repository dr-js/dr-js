#!/usr/bin/env node

import { cpus } from 'os'
import { resolve, normalize } from 'path'
import { createReadStream, createWriteStream, readFileSync, writeFileSync } from 'fs'
import { start as startREPL } from 'repl'

import { getEndianness } from 'source/env/function'

import { percent, time, binary, prettyStringifyJSON } from 'source/common/format'
import { indentList } from 'source/common/string'
import { setTimeoutAsync } from 'source/common/time'
import { isBasicObject, isBasicFunction } from 'source/common/check'
import { throttle } from 'source/common/function'

import { writeBufferToStreamAsync, quickRunletFromStream } from 'source/node/data/Stream'
import { createDirectory } from 'source/node/file/Directory'
import { modifyCopy, modifyRename, modifyDelete } from 'source/node/file/Modify'
import { autoTestServerPort } from 'source/node/server/function'
import { createServerExot } from 'source/node/server/Server'
import { createTCPProxyListener } from 'source/node/server/Proxy'
import { getDefaultOpenCommandList } from 'source/node/system/DefaultOpen'
import { resolveCommandAsync } from 'source/node/system/ResolveCommand'
import { runSync } from 'source/node/system/Run'
import { getAllProcessStatusAsync, describeAllProcessStatusAsync } from 'source/node/system/Process'
import { getSystemStatus, describeSystemStatus } from 'source/node/system/Status'
import { fetchWithJump } from 'source/node/net'

import { commonServerUp, commonServerDown, configure as configureServerTestConnection } from './server/testConnection'
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
  const { tryGet, tryGetFirst, getToggle } = optionData
  const log = getToggle('quiet')
    ? () => {}
    : console.log
  const logTaskResult = (task, path) => task(path).then(
    () => log(`[${modeName}] done: ${path}`),
    (error) => log(`[${modeName}] error: ${path}\n${error.stack || error}`)
  )

  const argumentList = tryGet(modeName) || []
  const isOutputJSON = getToggle('json')
  const root = tryGetFirst('root') || process.cwd()
  const inputFile = tryGetFirst('input-file')
  const outputFile = tryGetFirst('output-file')
  const outputBuffer = (buffer) => outputFile
    ? writeFileSync(outputFile, buffer)
    : writeBufferToStreamAsync(process.stdout, buffer)
  const outputStream = (stream) => quickRunletFromStream(
    stream,
    outputFile ? createWriteStream(outputFile) : process.stdout
  )

  // for ipv6 should use host like: `[::]:80`
  const parseHost = (host, defaultHostname) => {
    const hostnameList = host.split(':')
    const port = Number(hostnameList.pop())
    const hostname = hostnameList.join(':') || defaultHostname
    return { hostname, port }
  }
  const quickServerExot = async (protocol = 'http:') => {
    const { hostname, port } = parseHost(tryGetFirst('host') || '', '0.0.0.0')
    return createServerExot({
      protocol,
      hostname,
      port: port || await autoTestServerPort([ 80, 8080, 8888, 8800, 8000 ], hostname) // for more stable port
    })
  }
  const startServer = async (configureFunc, option) => {
    const serverExot = await quickServerExot()
    const routePrefix = tryGetFirst('route-prefix') || ''
    commonServerDown(serverExot)
    return commonServerUp({ serverExot, log, routePrefix, ...configureFunc({ serverExot, log, routePrefix, ...option }) })
  }

  switch (modeName) {
    case 'eval': {
      modulePathHack()
      const result = await evalScript(
        inputFile ? String(readFileSync(inputFile)) : argumentList[ 0 ],
        inputFile || resolve('__SCRIPT_STRING__'),
        inputFile ? argumentList : argumentList.slice(1),
        optionData
      )
      return result !== undefined && outputBuffer(Buffer.isBuffer(result) ? result : Buffer.from(String(result)))
    }
    case 'repl':
      modulePathHack()
      return startREPL({ useGlobal: true }) // NOTE: need manual Ctrl+C

    case 'wait': {
      const waitTime = argumentList[ 0 ] || 2 * 1000
      return setTimeoutAsync(waitTime)
    }
    case 'echo':
      return logAuto(argumentList)
    case 'cat': {
      if (argumentList.length) for (const path of argumentList) await quickRunletFromStream(createReadStream(path), process.stdout)
      else if (!process.stdin.isTTY) await quickRunletFromStream(process.stdin, process.stdout)
      return
    }
    case 'write':
    case 'append': {
      if (process.stdin.isTTY) throw new Error('unsupported TTY stdin') // teletypewriter(TTY)
      const flags = modeName === 'write' ? 'w' : 'a'
      return quickRunletFromStream(process.stdin, createWriteStream(argumentList[ 0 ], { flags }))
    }
    case 'merge': {
      const [ mergedFile, ...fileList ] = argumentList
      for (const path of fileList) await quickRunletFromStream(createReadStream(path), createWriteStream(mergedFile, { flags: 'a' }))
      return
    }

    case 'open': {
      const uri = argumentList[ 0 ] || '.' // can be url or path
      const [ command, ...prefixArgList ] = getDefaultOpenCommandList()
      return runSync({ command, argList: [ ...prefixArgList, uri.includes('://') ? uri : normalize(uri) ] })
    }
    case 'which': {
      const commandNameOrPath = argumentList[ 0 ]
      const resultCommand = await resolveCommandAsync(commandNameOrPath, root)
      if (!resultCommand) throw new Error(`failed to resolve command: ${commandNameOrPath}`)
      return logAuto(resultCommand)
    }
    case 'status':
      return logAuto(isOutputJSON ? getSystemStatus() : describeSystemStatus())

    case 'create-directory':
      for (const path of argumentList) await logTaskResult(createDirectory, path)
      return
    case 'modify-copy':
      return modifyCopy(argumentList[ 0 ], argumentList[ 1 ])
    case 'modify-rename':
      return modifyRename(argumentList[ 0 ], argumentList[ 1 ])
    case 'modify-delete':
      for (const path of argumentList) await logTaskResult(modifyDelete, path)
      return

    case 'fetch': {
      let [ initialUrl, method = 'GET', jumpMax = 4, timeout = 0 ] = argumentList
      jumpMax = Number(jumpMax) || 0 // 0 for no jump, use 'Infinity' for unlimited jump
      timeout = Number(timeout) || 0 // in msec, 0 for unlimited
      const body = inputFile ? readFileSync(inputFile) : null
      let isDone = false
      const response = await fetchWithJump(initialUrl, {
        method, timeout, jumpMax, body,
        headers: { 'accept': '*/*', 'user-agent': `${packageName}/${packageVersion}` }, // patch for
        onProgressUpload: throttle((now, total) => isDone || log(`[fetch-upload] ${percent(now / total)} (${binary(now)}B / ${binary(total)}B)`)),
        onProgressDownload: throttle((now, total) => isDone || log(`[fetch-download] ${percent(now / total)} (${binary(now)}B / ${binary(total)}B)`)),
        preFetch: (url, jumpCount, cookieList) => log(`[fetch] <${method}>${url}, jump: ${jumpCount}/${jumpMax}, timeout: ${timeout ? time(timeout) : 'none'}, cookie: ${cookieList.length}`)
      })
      if (!response.ok) throw new Error(`bad status: ${response.status}`)
      const contentLength = Number(response.headers[ 'content-length' ])
      log(`[fetch] status: ${response.status}, header: ${prettyStringifyJSON(response.headers, 1, '  ')}`)
      log(`[fetch] fetch response content${contentLength ? ` (${binary(contentLength)}B)` : ''}...`)
      await outputStream(response.stream()) // NOTE: stream will auto close, so if stdout is used, the "done" log will not print
      isDone = true
      return log('\n[fetch] done')
    }
    case 'process-status': {
      const [ outputMode = 'pid--' ] = argumentList
      return logAuto(await (isOutputJSON ? getAllProcessStatusAsync : describeAllProcessStatusAsync)(outputMode))
    }
    case 'json-format': {
      const [ unfoldLevel = 2 ] = argumentList
      return writeFileSync(outputFile || inputFile, prettyStringifyJSON(JSON.parse(String(readFileSync(inputFile))), unfoldLevel))
    }

    case 'server-serve-static':
    case 'server-serve-static-simple': {
      const [ expireTime = 5 * 1000 ] = argumentList // expireTime: 5sec, in msec
      return startServer(configureServerServeStatic, { isSimpleServe: modeName === 'server-serve-static-simple', expireTime: Number(expireTime), staticRoot: root })
    }
    case 'server-websocket-group':
      return startServer(configureServerWebSocketGroup)
    case 'server-test-connection':
      return startServer(configureServerTestConnection)
    case 'server-tcp-proxy': { // TODO: move to separate file?
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
      const serverExot = await quickServerExot('tcp:')
      serverExot.server.on('connection', createTCPProxyListener({ getTargetOption }))
      await serverExot.up()
      commonServerDown(serverExot)
      return log(indentList('[TCPProxy]', [
        `pid: ${process.pid}`,
        `at: ${serverExot.option.hostname}:${serverExot.option.port}`,
        ...targetOptionList.map((option) => `proxy to: ${option.hostname}:${option.port}`)
      ]))
    }
  }
}

const main = async () => {
  const optionData = await parseOption()
  if (optionData.getToggle('version')) return logAuto(getVersion())
  if (optionData.getToggle('help')) return logAuto(formatUsage())
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
