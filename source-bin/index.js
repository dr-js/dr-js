#!/usr/bin/env node

import { resolve, dirname } from 'path'
import { createReadStream, createWriteStream } from 'fs'

import { pipeStreamAsync } from 'dr-js/module/node/data/Stream'
import { createDirectory } from 'dr-js/module/node/file/File'
import { getFileList } from 'dr-js/module/node/file/Directory'
import { modify } from 'dr-js/module/node/file/Modify'
import { getDefaultOpen } from 'dr-js/module/node/system/DefaultOpen'
import { runSync } from 'dr-js/module/node/system/Run'
import { getSystemStatus, getProcessStatus, describeSystemStatus } from 'dr-js/module/node/system/Status'

import { getVersion } from './version'
import { parseOption, formatUsage } from './option'

import { autoTestServerPort, getPathContent } from './server/function'
import { createServerTestConnection } from './server/test-connection'
import { createServerServeStatic } from './server/serve-static'
import { createServerWebSocketGroup } from './server/websocket-group'

const logJSON = (object) => console.log(JSON.stringify(object, null, '  '))

const runMode = async (mode, { optionMap, getOption, getOptionOptional, getSingleOption, getSingleOptionOptional }) => {
  const argumentRootPath = (optionMap[ 'argument' ] && (optionMap[ 'argument' ].source === 'JSON')
    ? dirname(getSingleOption('config'))
    : process.cwd())
  const resolveArgumentPath = (path) => resolve(argumentRootPath, path)
  const singleArgumentPath = () => resolveArgumentPath(getSingleOptionOptional('argument') || '.')

  const log = getOptionOptional('quiet')
    ? () => {}
    : console.log
  const logTaskResult = (task, path) => task(path).then(
    () => log(`[${mode}] done: ${path}`),
    (error) => log(`[${mode}] error: ${path}\n${error.stack || error}`)
  )

  const getServerConfig = async (argumentList = getOptionOptional('argument')) => {
    const [
      hostname = '0.0.0.0',
      port = await autoTestServerPort([ 80, 8080 ], hostname)
    ] = argumentList || []
    return { hostname, port: Number(port) }
  }

  switch (mode) {
    case 'echo':
      return logJSON(getOption('argument'))
    case 'cat': {
      const argumentList = getOptionOptional('argument')
      if (argumentList && argumentList.length) for (const path of argumentList.map(resolveArgumentPath)) await pipeStreamAsync(process.stdout, createReadStream(path))
      else if (!process.stdin.isTTY) await pipeStreamAsync(process.stdout, process.stdin)
      return
    }
    case 'write':
    case 'append':
      if (process.stdin.isTTY) throw new Error('[pipe] stdin should not be TTY mode') // teletypewriter(TTY)
      const flags = mode === 'write' ? 'w' : 'a'
      return pipeStreamAsync(createWriteStream(resolveArgumentPath(getSingleOption('argument')), { flags }), process.stdin)
    case 'status':
    case 's':
      return (getOptionOptional('argument') || []).includes('h')
        ? console.log(describeSystemStatus())
        : logJSON({ ...getSystemStatus(), ...getProcessStatus() })
    case 'open':
    case 'o':
      return runSync({ command: getDefaultOpen(), argList: [ getSingleOptionOptional('argument') || '.' ] })
    case 'file-list':
    case 'ls':
      return logJSON(await getPathContent(singleArgumentPath()))
    case 'file-list-all':
    case 'ls-R':
      return logJSON(await getFileList(singleArgumentPath()))
    case 'file-create-directory':
    case 'mkdir':
      for (const path of getOption('argument').map(resolveArgumentPath)) await logTaskResult(createDirectory, path)
      return
    case 'file-modify-copy':
    case 'cp':
      return modify.copy(...getOption('argument', 2).map(resolveArgumentPath))
    case 'file-modify-move':
    case 'mv':
      return modify.move(...getOption('argument', 2).map(resolveArgumentPath))
    case 'file-modify-delete':
    case 'rm':
      for (const path of getOption('argument').map(resolveArgumentPath)) await logTaskResult(modify.delete, path)
      return
    case 'file-merge':
    case 'merge': {
      const fileList = getOption('argument').map(resolveArgumentPath)
      if (fileList.length < 2) return console.log(`[skipped] minimum 2 file, get ${fileList.length}`)
      const outputFile = fileList.shift()
      for (const path of fileList) await pipeStreamAsync(createWriteStream(outputFile, { flags: 'a' }), createReadStream(path))
      return
    }
    case 'server-serve-static':
    case 'sss':
    case 'server-serve-static-simple':
    case 'ssss': {
      const [ relativeStaticRoot = '.', ...argumentList ] = getOptionOptional('argument') || []
      const staticRoot = resolveArgumentPath(relativeStaticRoot)
      const isSimpleServe = [ 'server-serve-static-simple', 'ssss' ].includes(mode)
      return createServerServeStatic({ staticRoot, isSimpleServe, log, ...(await getServerConfig(argumentList)) })
    }
    case 'server-websocket-group':
    case 'swg':
      return createServerWebSocketGroup({ log, ...(await getServerConfig()) })
    case 'server-test-connection':
    case 'stc':
      return createServerTestConnection({ log, ...(await getServerConfig()) })
  }
}

const main = async () => {
  const optionData = await parseOption()
  const mode = optionData.getSingleOptionOptional('mode')

  if (mode) {
    await runMode(mode, optionData).catch((error) => {
      console.warn(`[Error] in mode: ${mode}:`, error.stack || error)
      process.exit(2)
    })
  } else optionData.getOptionOptional('version') ? logJSON(getVersion()) : console.log(formatUsage())
}

main().catch((error) => {
  console.warn(formatUsage(error.stack || error, 'simple'))
  process.exit(1)
})
