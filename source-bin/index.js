#!/usr/bin/env node

import { cpus } from 'os'
import { normalize } from 'path'
import { createReadStream, createWriteStream } from 'fs'

import { getEndianness } from 'source/env/function.js'

import { prettyStringifyJSON } from 'source/common/format.js'
import { indentList } from 'source/common/string.js'
import { setTimeoutAsync } from 'source/common/time.js'
import { isBasicFunction } from 'source/common/check.js'
import { prettyStringifyTreeNode } from 'source/common/data/Tree.js'

import { quickRunletFromStream } from 'source/node/data/Stream.js'
import { packB64, unpackB64, packGz64, unpackGz64, packBr64, unpackBr64 } from 'source/node/data/Z64String.js'
import { PATH_TYPE } from 'source/node/fs/Path.js'
import { readText, writeText, appendText, editTextSync, readJSON } from 'source/node/fs/File.js'
import { createDirectory, getDirInfoList, getDirInfoTree, getFileList } from 'source/node/fs/Directory.js'
import { modifyCopy, modifyRename, modifyDelete } from 'source/node/fs/Modify.js'
import { autoTestServerPort, parseHostString } from 'source/node/server/function.js'
import { createServerExot } from 'source/node/server/Server.js'
import { createTCPProxyListener } from 'source/node/server/Proxy.js'
import { getDefaultOpenCommandList } from 'source/node/system/DefaultOpen.js'
import { resolveCommand } from 'source/node/system/ResolveCommand.js'
import { run, runSync, runDetached } from 'source/node/run.js'
import { getAllProcessStatusAsync, describeAllProcessStatusAsync } from 'source/node/system/Process.js'
import { getSystemStatus, describeSystemStatus } from 'source/node/system/Status.js'
import { compressAutoAsync, extractAutoAsync } from 'source/node/module/Archive/archive.js'
import { runDocker, runCompose } from 'source/node/module/Software/docker.js'
import { pingRaceUrlList, pingStatUrlList } from 'source/node/module/PingRace.js'
import { describeAuthFile, generateAuthFile, generateAuthCheckCode, verifyAuthCheckCode } from 'source/node/module/Auth.js'

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
  const { getFirst, tryGetFirst, getToggle } = optionData
  const { argumentList, log, inputFile, outputFile, outputValueAuto } = sharedPack

  const isOutputJSON = getToggle('json')
  const root = tryGetFirst('root') || process.cwd()
  const logTaskResult = (task, path) => task(path).then(
    () => log(`[${modeName}] done: ${path}`),
    (error) => log(`[${modeName}] error: ${path}\n${error.stack || error}`)
  )

  const quickServerExot = async (protocol = 'http:') => {
    const { hostname, port } = parseHostString(tryGetFirst('host') || '', '0.0.0.0')
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

    case 'text-file': {
      const [ openMode = 'write' ] = argumentList
      return (openMode.startsWith('w') ? writeText : appendText)(outputFile, `${getFirst('note')}\n`)
    }
    case 'text-replace':
    case 'text-replace-all': {
      const [ fromString, toString ] = argumentList
      return editTextSync((string) => string[ modeName === 'text-replace' ? 'replace' : 'replaceAll' ](fromString, toString), inputFile)
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
      if (inputFile) argumentList.unshift(await readText(inputFile))
      const [ pidString, signal = 'SIGTERM' ] = argumentList
      return process.kill(Number(pidString), signal)
    }
    case 'json-format': {
      const [ unfoldLevel = 2 ] = argumentList
      return writeText(outputFile || inputFile, prettyStringifyJSON(await readJSON(inputFile), unfoldLevel))
    }

    case 'encode':
    case 'decode': {
      const [ codecType = 'b64' ] = argumentList
      const [ encode, decode ] = ({
        'b64': [ packB64, unpackB64 ],
        'gz64': [ packGz64, unpackGz64 ],
        'br64': [ packBr64, unpackBr64 ]
      })[ codecType ]
      return outputValueAuto((modeName === 'encode' ? encode : decode)(getFirst('note')))
    }

    case 'file-list':
    case 'file-list-all':
    case 'file-tree': {
      const prettyStringifyFileTree = async (rootPath) => {
        const { dirInfoListMap } = await getDirInfoTree(rootPath)
        const resultList = []
        prettyStringifyTreeNode(
          ([ [ path ], level /* , hasMore */ ]) => dirInfoListMap.get(path)?.map(
            ({ name, path: subPath }, subIndex, { length }) => [ [ subPath, name ], level + 1, subIndex !== length - 1 ]
          ),
          [ [ rootPath, 'NAME' ], -1, false ],
          (prefix, [ , name ]) => resultList.push(`${prefix}${name}`)
        )
        return resultList.join('\n')
      }
      const rootPath = argumentList[ 0 ] || process.cwd()
      return outputValueAuto(modeName === 'file-list' ? (await getDirInfoList(rootPath)).map(({ type, name }) => type === PATH_TYPE.Directory ? `${name}/` : name)
        : modeName === 'file-list-all' ? await getFileList(rootPath)
          : modeName === 'file-tree' ? await prettyStringifyFileTree(rootPath)
            : '')
    }

    case 'compress':
      return compressAutoAsync(inputFile, outputFile)
    case 'extract':
      return extractAutoAsync(inputFile, outputFile)

    case 'docker':
      return runDocker(argumentList).promise
    case 'docker-compose':
      return runCompose(argumentList).promise

    case 'auth-file-describe':
      return outputValueAuto(await describeAuthFile(inputFile))
    case 'auth-check-code-generate':
      return outputValueAuto(await generateAuthCheckCode(inputFile, argumentList[ 0 ])) // timestamp
    case 'auth-check-code-verify':
      await verifyAuthCheckCode(inputFile, argumentList[ 0 ], argumentList[ 1 ] && Number(argumentList[ 1 ])) // checkCode, timestamp
      return outputValueAuto('pass verify')
    case 'auth-gen-tag':
      await generateAuthFile(outputFile, {
        tag: argumentList[ 0 ],
        size: tryGetFirst('auth-gen-size'),
        tokenSize: tryGetFirst('auth-gen-token-size'),
        timeGap: tryGetFirst('auth-gen-time-gap'),
        info: tryGetFirst('auth-gen-info')
      })
      return log(await describeAuthFile(outputFile))

    case 'ping-race':
    case 'ping-stat':
      return outputValueAuto(await (modeName === 'ping-race' ? pingRaceUrlList : pingStatUrlList)(
        argumentList,
        { timeout: tryGetFirst('timeout') || 5000 }
      ))

    case 'server-serve-static':
    case 'server-serve-static-simple':
    case 'server-serve-static-api': {
      const [ expireTime = 5 * 1000 ] = argumentList // expireTime: 5sec, in msec
      return startServer(configureServerServeStatic, { isSimpleServe: modeName.endsWith('-simple'), isSimpleApi: modeName.endsWith('-api'), expireTime: Number(expireTime), staticRoot: root })
    }
    case 'server-websocket-group':
      return startServer(configureServerWebSocketGroup)
    case 'server-test-connection':
    case 'server-test-connection-simple':
      return startServer(configureServerTestConnection, { isSimpleTest: modeName.endsWith('-simple') })
    case 'server-tcp-proxy': { // TODO: move to separate file?
      let targetOptionList
      let getTargetOption
      if (!isBasicFunction(argumentList[ 0 ])) {
        targetOptionList = argumentList.map((host) => parseHostString(host, '127.0.0.1'))
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
