#!/usr/bin/env node

import { resolve, dirname } from 'path'
import { spawnSync } from 'child_process'

import { createDirectory } from 'dr-js/module/node/file/File'
import { getFileList } from 'dr-js/module/node/file/Directory'
import { modify } from 'dr-js/module/node/file/Modify'
import { getDefaultOpen } from 'dr-js/module/node/system/DefaultOpen'

import { getVersion } from './version'
import { parseOption, formatUsage } from './option'

import { autoTestServerPort, getPathContent } from './server/__utils__'
import { createServerServeStatic } from './server/serve-static'
import { createServerWebSocketGroup } from './server/websocket-group'

const logJSON = (object) => console.log(JSON.stringify(object, null, '  '))

const main = async () => {
  const optionData = await parseOption()
  const mode = optionData.getSingleOptionOptional('mode')
  if (mode) {
    runMode(mode, optionData).catch((error) => {
      console.warn(`[Error] in mode: ${mode}:`, error)
      process.exit(2)
    })
  } else if (optionData.getOptionOptional('version')) logJSON(getVersion())
  else console.log(formatUsage())
}

const runMode = async (mode, { optionMap, getOption, getOptionOptional, getSingleOption, getSingleOptionOptional }) => {
  const argumentRootPath = (optionMap[ 'argument' ] && (optionMap[ 'argument' ].source === 'JSON')
    ? dirname(getSingleOption('config'))
    : process.cwd())

  const resolveArgumentPath = (path) => resolve(argumentRootPath, path)

  const log = getOptionOptional('quiet')
    ? () => {}
    : console.log

  switch (mode) {
    case 'open':
    case 'o':
      return spawnSync(getDefaultOpen(), getOptionOptional('argument') || [ '.' ], { cwd: argumentRootPath, stdio: 'inherit', shell: true })
    case 'file-list':
    case 'ls':
      return logJSON(await getPathContent(getSingleOptionOptional('argument') || '.'))
    case 'file-list-all':
    case 'ls-R':
      return logJSON(await getFileList(getSingleOptionOptional('argument') || '.'))
    case 'file-create-directory':
    case 'mkdir':
      for (const path of getOption('argument').map(resolveArgumentPath)) {
        await createDirectory(path).then(
          () => log(`[CREATE-DONE] ${path}`),
          (error) => log(`[CREATE-ERROR] ${path}\n  ${error}`)
        )
      }
      return
    case 'file-modify-copy':
    case 'cp':
      return modify.copy(...getOption('argument', 2))
    case 'file-modify-move':
    case 'mv':
      return modify.move(...getOption('argument', 2))
    case 'file-modify-delete':
    case 'rm':
      for (const path of getOption('argument').map(resolveArgumentPath)) {
        await modify.delete(path).then(
          () => log(`[DELETE-DONE] ${path}`),
          (error) => log(`[DELETE-ERROR] ${path}\n  ${error}`)
        )
      }
      return
    case 'server-serve-static':
    case 'sss':
    case 'server-serve-static-simple':
    case 'ssss': {
      const [
        relativeStaticRoot = '.',
        hostname = '0.0.0.0',
        port = await autoTestServerPort([ 80, 8080 ], hostname)
      ] = getOptionOptional('argument') || []
      const isSimpleServe = [ 'server-serve-static-simple', 'ssss' ].includes(mode)
      return createServerServeStatic({ staticRoot: resolveArgumentPath(relativeStaticRoot), protocol: 'http:', hostname, port: Number(port), isSimpleServe, log })
    }
    case 'server-websocket-group':
    case 'swg': {
      const [
        hostname = '0.0.0.0',
        port = await autoTestServerPort([ 80, 8080 ], hostname)
      ] = getOptionOptional('argument') || []
      return createServerWebSocketGroup({ protocol: 'http:', hostname, port: Number(port), log })
    }
  }
}

main().catch((error) => {
  console.warn(formatUsage(error.stack || error, 'simple'))
  process.exit(1)
})
