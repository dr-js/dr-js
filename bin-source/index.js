#!/usr/bin/env node

import nodeModulePath from 'path'
import { Env, Node } from '../library/Dr.node'
import { parseOption, exitWithError } from './option'
import { createServerServeStatic } from './server-serve-static'

const { isNode, isBrowser, environmentName, systemEndianness } = Env
const { modify, getFileList } = Node.File

const main = async () => {
  const { optionMap, getOption, getSingleOption } = await parseOption()

  try {
    switch (getSingleOption(optionMap, 'mode')) {
      case 'env-info':
        return console.log(JSON.stringify({ isNode, isBrowser, environmentName, systemEndianness }, null, '  '))
      case 'file-list':
      case 'ls':
        return console.log(JSON.stringify(await getFileList(getSingleOption(optionMap, 'argument'))))
      case 'file-modify-copy':
      case 'cp':
        return modify.copy(...getOption(optionMap, 'argument', 2))
      case 'file-modify-move':
      case 'mv':
        return modify.move(...getOption(optionMap, 'argument', 2))
      case 'file-modify-delete':
      case 'rm':
        for (const path of getOption(optionMap, 'argument')) await modify.delete(path).then(() => console.log(`[DELETE-DONE] ${path}`), (error) => console.warn(`[DELETE-ERROR] ${error}`))
        return
      case 'server-serve-static':
      case 'sss':
        let [ staticRoot, hostname = '0.0.0.0', port = 80 ] = getOption(optionMap, 'argument')
        staticRoot = nodeModulePath.resolve(optionMap[ 'argument' ].source === 'JSON' ? nodeModulePath.dirname(getSingleOption(optionMap, 'config')) : process.cwd(), staticRoot)
        return createServerServeStatic({ staticRoot, protocol: 'http:', hostname, port })
    }
  } catch (error) {
    console.warn(`[Error] in mode: ${getSingleOption(optionMap, 'mode')}:`)
    console.warn(error)
    process.exit(2)
  }
}

main().catch(exitWithError)
