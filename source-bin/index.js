#!/usr/bin/env node

import { cpus } from 'os'
import { normalize } from 'path'
import { createReadStream, createWriteStream, promises as fsAsync } from 'fs'

import { getEndianness } from 'source/env/function.js'

import { prettyStringifyJSON } from 'source/common/format.js'
import { indentList } from 'source/common/string.js'
import { setTimeoutAsync } from 'source/common/time.js'
import { isBasicFunction } from 'source/common/check.js'

import { quickRunletFromStream } from 'source/node/data/Stream.js'
import { createDirectory } from 'source/node/fs/Directory.js'
import { modifyCopy, modifyRename, modifyDelete } from 'source/node/fs/Modify.js'
import { autoTestServerPort } from 'source/node/server/function.js'
import { createServerExot } from 'source/node/server/Server.js'
import { createTCPProxyListener } from 'source/node/server/Proxy.js'
import { getDefaultOpenCommandList } from 'source/node/system/DefaultOpen.js'
import { resolveCommand } from 'source/node/system/ResolveCommand.js'
import { run, runSync, runDetached } from 'source/node/run.js'
import { getAllProcessStatusAsync, describeAllProcessStatusAsync } from 'source/node/system/Process.js'
import { getSystemStatus, describeSystemStatus } from 'source/node/system/Status.js'

import { commonServerUp, commonServerDown, configure as configureServerTestConnection } from './server/testConnection.js'
import { configure as configureServerServeStatic } from './server/serveStatic.js'
import { configure as configureServerWebSocketGroup } from './server/websocketGroup.js'

import { logAuto, sharedOption, sharedMode } from './function.js'
import { MODE_NAME_LIST, parseOption, formatUsage } from './option.js'

import { name as packageName, version as packageVersion } from '../package.json'

const getVersion = () => ({
  packageName,
  packageVersion,
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch,
  endianness: getEndianness(),
  cpuCount: (cpus() || [ 'TERMUX FIX' ]).length // TODO: fix Termux, check: https://github.com/termux/termux-app/issues/299
})

const runMode = async (optionData, modeName) => {
  const sharedPack = sharedOption(optionData, modeName)
  const { tryGetFirst, getToggle } = optionData
  const { argumentList, log, inputFile, outputFile } = sharedPack

  const isOutputJSON = getToggle('json')
  const root = tryGetFirst('root') || process.cwd()
  const logTaskResult = (task, path) => task(path).then(
    () => log(`[${modeName}] done: ${path}`),
    (error) => log(`[${modeName}] error: ${path}\n${error.stack || error}`)
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
    commonServerDown(serverExot, log)
    return commonServerUp({ serverExot, log, routePrefix, ...configureFunc({ serverExot, log, routePrefix, ...option }) })
  }

  switch (modeName) {
    case 'wait': {
      const waitTime = argumentList[ 0 ] || (2 * 1000)
      return setTimeoutAsync(waitTime) // TODO: currently this need to be stopped with SIGKILL, SIGTERM will not work as the ref still holds
    }
    case 'echo':
      return log(argumentList)
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
      const [ uri = '.', isDetached = false ] = argumentList // `uri` can be url or path, and detached will lost logging, but allow followup command to run
      return (isDetached ? runDetached : runSync)([ ...getDefaultOpenCommandList(), uri.includes('://') ? uri : normalize(uri) ])
    }
    case 'which': {
      const commandNameOrPath = argumentList[ 0 ]
      const resultCommand = resolveCommand(commandNameOrPath, root)
      if (!resultCommand) throw new Error(`failed to resolve command: ${commandNameOrPath}`)
      return log(resultCommand)
    }
    case 'run': {
      const commandNameOrPath = argumentList[ 0 ]
      return run([ resolveCommand(commandNameOrPath, root), ...argumentList.slice(1) ]).promise
    }
    case 'detach': {
      const commandNameOrPath = argumentList[ 0 ]
      return runDetached([ resolveCommand(commandNameOrPath, root), ...argumentList.slice(1) ], { stdoutFile: outputFile || undefined })
    }
    case 'status':
      return log(isOutputJSON ? getSystemStatus() : describeSystemStatus())

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

    case 'process-status': {
      const [ outputMode = 'pid--' ] = argumentList
      return log(await (isOutputJSON ? getAllProcessStatusAsync : describeAllProcessStatusAsync)(outputMode))
    }
    case 'process-signal': {
      if (inputFile) argumentList.unshift(String(await fsAsync.readFile(inputFile)))
      const [ pidString, signal = 'SIGTERM' ] = argumentList
      return process.kill(Number(pidString), signal)
    }
    case 'json-format': {
      const [ unfoldLevel = 2 ] = argumentList
      return fsAsync.writeFile(outputFile || inputFile, prettyStringifyJSON(JSON.parse(String(await fsAsync.readFile(inputFile))), unfoldLevel))
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
      commonServerDown(serverExot, log)
      return log(indentList('[TCPProxy]', [
        `pid: ${process.pid}`,
        `at: ${serverExot.option.hostname}:${serverExot.option.port}`,
        ...targetOptionList.map((option) => `proxy to: ${option.hostname}:${option.port}`)
      ]))
    }

    default:
      return sharedMode({
        ...sharedPack,
        fetchUA: `${packageName}/${packageVersion}`
      })
  }
}

const main = async () => {
  const optionData = await parseOption()
  if (optionData.getToggle('version')) return logAuto(getVersion())
  if (optionData.getToggle('help')) return logAuto(formatUsage())
  const modeName = MODE_NAME_LIST.find((name) => optionData.tryGet(name))
  if (!modeName) throw new Error('no mode specified')
  await runMode(optionData, modeName).catch((error) => {
    console.warn(`[Error] in mode: ${modeName}: ${error.stack || error}`)
    process.exit(2)
  })
}

main().catch((error) => {
  console.warn(formatUsage(error.stack || error, 'simple'))
  process.exit(1)
})
