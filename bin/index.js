#!/usr/bin/env node

import nodeModulePath from 'path'
import { cpus } from 'os'
import { spawnSync } from 'child_process'
import { name as packageName, version as packageVersion } from '../package.json'
import { systemEndianness } from 'dr-js/module/env'
import { getDefaultOpen } from 'dr-js/module/node/system'
import { modify, getFileList, createDirectory } from 'dr-js/module/node/file'
import { parseOption, exitWithError } from './option'
import { autoTestServerPort, getPathContent, createServerServeStatic, createServerWebSocketGroup } from './server'

const main = async () => {
  const { optionMap, getOption, getOptionOptional, getSingleOption, getSingleOptionOptional } = await parseOption()
  const argumentRootPath = (optionMap[ 'argument' ] && (optionMap[ 'argument' ].source === 'JSON')
    ? nodeModulePath.dirname(getSingleOption('config'))
    : process.cwd())
  const resolveArgumentPath = (path) => nodeModulePath.resolve(argumentRootPath, path)
  const logJSON = (object) => console.log(JSON.stringify(object, null, '  '))

  try {
    const mode = getSingleOption('mode')
    switch (mode) {
      case 'env-info':
      case 'i': {
        return logJSON({
          packageName,
          packageVersion,
          versionNode: process.versions.node,
          versionV8: process.versions.v8,
          systemPlatform: process.platform,
          systemEndianness,
          systemCPUArchitecture: process.arch,
          systemCPUCoreCount: cpus().length
        })
      }
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
            () => console.log(`[CREATE-DONE] ${path}`),
            (error) => console.warn(`[CREATE-ERROR] ${path}\n  ${error}`)
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
            () => console.log(`[DELETE-DONE] ${path}`),
            (error) => console.warn(`[DELETE-ERROR] ${path}\n  ${error}`)
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
        return createServerServeStatic({ staticRoot: resolveArgumentPath(relativeStaticRoot), protocol: 'http:', hostname, port: Number(port), isSimpleServe })
      }
      case 'server-websocket-group':
      case 'swg': {
        const [
          hostname = '0.0.0.0',
          port = await autoTestServerPort([ 80, 8080 ], hostname)
        ] = getOptionOptional('argument') || []
        return createServerWebSocketGroup({ protocol: 'http:', hostname, port: Number(port) })
      }
    }
  } catch (error) {
    console.warn(`[Error] in mode: ${getSingleOption('mode')}:`)
    console.warn(error)
    process.exit(2)
  }
}

main().catch(exitWithError)
