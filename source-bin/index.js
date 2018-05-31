#!/usr/bin/env node

import { createReadStream, createWriteStream, writeFileSync } from 'fs'
import { cpus } from 'os'

import { getEndianness } from 'dr-js/module/env'
import { generateCheckCode, verifyCheckCode } from 'dr-js/module/common/module/TimedLookup'
import { generateLookupData, saveLookupFile, loadLookupFile } from 'dr-js/module/node/module/TimedLookup'
import { fetch } from 'dr-js/module/node/net'
import { pipeStreamAsync } from 'dr-js/module/node/data/Stream'
import { createDirectory } from 'dr-js/module/node/file/File'
import { getFileList } from 'dr-js/module/node/file/Directory'
import { modify } from 'dr-js/module/node/file/Modify'
import { getDefaultOpen } from 'dr-js/module/node/system/DefaultOpen'
import { runSync } from 'dr-js/module/node/system/Run'
import { getSystemStatus, getProcessStatus, describeSystemStatus } from 'dr-js/module/node/system/Status'

import { name as packageName, version as packageVersion } from '../package.json'
import { MODE_FORMAT_LIST, parseOption, formatUsage } from './option'
import { autoTestServerPort, getPathContent } from './server/function'
import { createServerTestConnection } from './server/testConnection'
import { createServerServeStatic } from './server/serveStatic'
import { createServerWebSocketGroup } from './server/websocketGroup'
import { createServerCacheHttpProxy } from './server/cacheHttpProxy'

const runMode = async (modeFormat, { optionMap, getOption, getOptionOptional, getSingleOption, getSingleOptionOptional }) => {
  const log = getOptionOptional('quiet')
    ? () => {}
    : console.log
  const logTaskResult = (task, path) => task(path).then(
    () => log(`[${modeFormat.name}] done: ${path}`),
    (error) => log(`[${modeFormat.name}] error: ${path}\n${error.stack || error}`)
  )

  const argumentList = getOptionOptional(modeFormat.name) || []

  const getServerConfig = async () => {
    const hostname = getSingleOptionOptional('hostname') || '0.0.0.0'
    const port = getSingleOptionOptional('port') || await autoTestServerPort([ 80, 8080, 8888, 8000 ], hostname) // for more stable port
    return { hostname, port: Number(port) }
  }

  switch (modeFormat.name) {
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
    case 'open':
      return runSync({ command: getDefaultOpen(), argList: [ argumentList[ 0 ] || '.' ] }) // can be url
    case 'status':
      return getOptionOptional('help')
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
      const [ outputFile, ...fileList ] = argumentList
      for (const path of fileList) await pipeStreamAsync(createWriteStream(outputFile, { flags: 'a' }), createReadStream(path))
      return
    }
    case 'fetch': {
      const outputFile = getSingleOptionOptional('output-file')
      const response = await fetch(argumentList[ 0 ])
      if (!response.ok) return log(`[fetch] failed for: ${argumentList[ 0 ]}, status: ${response.status}`)
      return outputFile
        ? writeFileSync(outputFile, await response.buffer(), { flags: 'a' })
        : console.log(await response.text())
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
    case 'timed-lookup-file-generate': {
      const outputFile = getSingleOptionOptional('output-file')
      const [ tag, size, tokenSize, timeGap ] = argumentList
      return saveLookupFile(outputFile, await generateLookupData({ tag, size, tokenSize, timeGap }))
    }
    case 'timed-lookup-check-code-generate':
      return console.log(generateCheckCode(await loadLookupFile(getSingleOptionOptional('input-file'))))
    case 'timed-lookup-check-code-verify':
      verifyCheckCode(await loadLookupFile(getSingleOptionOptional('input-file')), argumentList[ 0 ])
      return console.log('valid checkCode')
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
  processorCount: (cpus() || [ 'TERMUX FIX' ]).length // TODO: check Termux fix
})

const main = async () => {
  const optionData = await parseOption()
  const modeFormat = MODE_FORMAT_LIST.find(({ name }) => optionData.getOptionOptional(name))

  if (modeFormat) {
    await runMode(modeFormat, optionData).catch((error) => {
      console.warn(`[Error] in mode: ${modeFormat.name}:`, error.stack || error)
      process.exit(2)
    })
  } else optionData.getOptionOptional('version') ? logJSON(getVersion()) : console.log(formatUsage())
}

main().catch((error) => {
  console.warn(formatUsage(error.stack || error, 'simple'))
  process.exit(1)
})
