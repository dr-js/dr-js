#!/usr/bin/env node

import nodeModulePath from 'path'
import nodeModuleOs from 'os'
import PackageJSON from 'package.json'
import { Env, Node } from 'module/Dr.node'
import { parseOption, exitWithError } from './option'
import { createServerServeStatic, autoTestServerPort, getPathContent } from './server-serve-static'

const { systemEndianness } = Env
const { modify, getFileList, createDirectory } = Node.File

const logJSON = (object) => console.log(JSON.stringify(object, null, '  '))

const main = async () => {
  const { optionMap, getOption, getOptionOptional, getSingleOption, getSingleOptionOptional } = await parseOption()

  const argumentRootPath = (optionMap[ 'argument' ] && (optionMap[ 'argument' ].source === 'JSON')
    ? nodeModulePath.dirname(getSingleOption(optionMap, 'config'))
    : process.cwd())

  const resolveArgumentPath = (path) => nodeModulePath.resolve(argumentRootPath, path)

  try {
    const mode = getSingleOption(optionMap, 'mode')
    switch (mode) {
      case 'env-info':
      case 'i':
        const { name: packageName, version: packageVersion } = PackageJSON
        const { versions: { node: versionNode, v8: versionV8 } } = process
        const systemPlatform = nodeModuleOs.platform()
        const systemCPUArchitecture = nodeModuleOs.arch()
        const systemCPUCoreCount = nodeModuleOs.cpus().length
        return logJSON({ packageName, packageVersion, versionNode, versionV8, systemEndianness, systemPlatform, systemCPUArchitecture, systemCPUCoreCount })
      case 'file-list':
      case 'ls':
        return logJSON(await getPathContent(getSingleOptionOptional(optionMap, 'argument') || './'))
      case 'file-list-all':
      case 'ls-R':
        return logJSON(await getFileList(getSingleOptionOptional(optionMap, 'argument') || './'))
      case 'file-create-directory':
      case 'mkdir':
        for (const path of getOption(optionMap, 'argument').map(resolveArgumentPath)) {
          await createDirectory(path).then(
            () => console.log(`[CREATE-DONE] ${path}`),
            (error) => console.warn(`[CREATE-ERROR] ${path}\n  ${error}`)
          )
        }
        return
      case 'file-modify-copy':
      case 'cp':
        return modify.copy(...getOption(optionMap, 'argument', 2))
      case 'file-modify-move':
      case 'mv':
        return modify.move(...getOption(optionMap, 'argument', 2))
      case 'file-modify-delete':
      case 'rm':
        for (const path of getOption(optionMap, 'argument').map(resolveArgumentPath)) {
          await modify.delete(path).then(
            () => console.log(`[DELETE-DONE] ${path}`),
            (error) => console.warn(`[DELETE-ERROR] ${path}\n  ${error}`)
          )
        }
        return
      case 'server-serve-static':
      case 'sss':
      case 'server-serve-static-simple':
      case 'ssss':
        const [ relativeStaticRoot = '.', hostname = '0.0.0.0', port = await autoTestServerPort(80, hostname) ] = getOptionOptional(optionMap, 'argument') || []
        const isSimpleServe = [ 'server-serve-static-simple', 'ssss' ].includes(mode)
        return createServerServeStatic({ staticRoot: resolveArgumentPath(relativeStaticRoot), protocol: 'http:', hostname, port: Number(port), isSimpleServe })
    }
  } catch (error) {
    console.warn(`[Error] in mode: ${getSingleOption(optionMap, 'mode')}:`)
    console.warn(error)
    process.exit(2)
  }
}

main().catch(exitWithError)
