#!/usr/bin/env node

const nodeModulePath = require('path')
const nodeModuleFs = require('fs')
const { promisify } = require('util')
const Dr = require('../library/Dr.node')

const {
  Common: {
    Module: { createOptionParser, OPTION_CONFIG_PRESET },
    Format: { escapeHTML }
  },
  Node: {
    File: { getFileList, modify },
    Server: {
      createServer,
      createRequestListener,
      Responder: {
        createRouterMapBuilder,
        createResponderRouter,
        createResponderParseURL,
        createResponderServeStatic
      }
    }
  }
} = Dr
const readFileAsync = promisify(nodeModuleFs.readFile)
const __DEV__ = false

const MODE_OPTION = [
  'env-info',

  'file-list',
  'file-modify-copy',
  'file-modify-move',
  'file-modify-delete',

  'server-serve-static'
]
const OPTION_CONFIG = {
  prefixENV: 'dr-js',
  formatList: [
    {
      name: 'config',
      shortName: 'c',
      optional: true,
      description: `# from JSON: set to path relative process.cwd()\n# from ENV: set to 'env' to collect from process.env`,
      ...OPTION_CONFIG_PRESET.SingleString
    },
    {
      name: 'mode',
      shortName: 'm',
      description: `should be one of [ ${MODE_OPTION.join(', ')} ]`,
      ...OPTION_CONFIG_PRESET.OneOfString(MODE_OPTION)
    },
    { name: 'argument', shortName: 'a', optional: true, argumentCount: '0+' }
  ]
}

const { parseCLI, parseENV, parseJSON, processOptionMap, formatUsage } = createOptionParser(OPTION_CONFIG)

const exitWithError = (error) => {
  __DEV__ && console.warn(error)
  console.warn(formatUsage(error.message || error.toString()))
  process.exit(1)
}

const main = async () => {
  let optionMap = optionMapResolvePath(parseCLI(process.argv), process.cwd())

  const getOption = (name, argumentCount) => {
    const argumentList = getOptionOptional(name) || exitWithError(new Error(`[option] missing option ${name}`))
    if (argumentCount !== undefined && argumentList.length !== argumentCount) exitWithError(new Error(`[option] expecting ${name} has ${argumentCount} value instead of ${argumentList.length}`))
    return argumentList
  }
  const getOptionOptional = (name) => optionMap[ name ] && optionMap[ name ].argumentList

  const getSingleOption = (name) => getOption(name, 1)[ 0 ]
  const getSingleOptionOptional = (name) => optionMap[ name ] && optionMap[ name ].argumentList[ 0 ]

  const config = getSingleOptionOptional('config')
  if (config && config.toLowerCase() === 'env') {
    const envOptionMap = optionMapResolvePath(parseENV(process.env), process.cwd())
    optionMap = { ...envOptionMap, ...optionMap }
  } else if (config) {
    const jsonOptionMap = optionMapResolvePath(parseJSON(JSON.parse(await readFileAsync(config, 'utf8'))), nodeModulePath.dirname(config))
    optionMap = { ...jsonOptionMap, ...optionMap }
  }

  __DEV__ && console.log('[option]')
  __DEV__ && Object.keys(optionMap).forEach((name) => console.log(`  - [${name}] ${JSON.stringify(getOption(name))}`))

  optionMap = processOptionMap(optionMap)
  __DEV__ && console.log('processOptionMap PASS')

  try {
    switch (getSingleOption('mode')) {
      case 'env-info':
        const { isNode, isBrowser, environmentName, systemEndianness } = Dr.Env
        return console.log({ isNode, isBrowser, environmentName, systemEndianness })
      case 'file-list':
        return console.log(JSON.stringify(await getFileList(getSingleOption('argument'))))
      case 'file-modify-copy':
        return modify.copy(...getOption('argument', 2))
      case 'file-modify-move':
        return modify.move(...getOption('argument', 2))
      case 'file-modify-delete':
        for (const path of getOption('argument')) await modify.delete(path).then(() => console.log(`[DELETE-DONE] ${path}`), (error) => console.warn(`[DELETE-ERROR] ${error}`))
        return
      case 'server-serve-static':
        let [ staticRoot, hostname = '0.0.0.0', port = 80 ] = getOptionOptional('argument')
        staticRoot = nodeModulePath.resolve(optionMap[ 'argument' ].source === 'JSON' ? nodeModulePath.dirname(config) : process.cwd(), staticRoot)
        return enableServerServeStatic(createServer({ protocol: 'http:', hostname, port }), staticRoot).start()
    }
  } catch (error) { console.warn(`[Error] in mode: ${getSingleOption('mode')}:\n`, error) }
}

const optionMapResolvePath = (optionMap, pathRelative) => {
  Object.values(optionMap).forEach(({ format: { isPath }, argumentList }) => isPath && argumentList.forEach((v, i) => (argumentList[ i ] = nodeModulePath.resolve(pathRelative, v))))
  return optionMap
}

// TODO: make reusable
const enableServerServeStatic = ({ server, start, stop, option }, staticRoot) => {
  const bufferImageFavicon = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAMSURBVBhXY0he9x8AA4gCEfhXWY0AAAAASUVORK5CYII=', 'base64')
  const responderServeStatic = createResponderServeStatic({ staticRoot })
  const routerMapBuilder = createRouterMapBuilder()
  const getFilePath = (store) => decodeURI(store.getState().paramMap[ routerMapBuilder.ROUTE_ANY ])
  routerMapBuilder.addRoute('/favicon.ico', 'GET', (store) => store.response.write(bufferImageFavicon))
  routerMapBuilder.addRoute('/file/*', 'GET', (store) => {
    store.setState({ filePath: getFilePath(store) })
    return responderServeStatic(store)
  })
  routerMapBuilder.addRoute('/list/*', 'GET', async (store) => store.response.write(await renderRelativeFilePathList(staticRoot, getFilePath(store))))
  routerMapBuilder.addRoute('/', 'GET', async (store) => store.response.write(await renderRelativeFilePathList(staticRoot, '')))
  server.on('request', createRequestListener({ responderList: [ createResponderParseURL(option), createResponderRouter(routerMapBuilder.getRouterMap()) ] }))
  return { server, start, stop, option }
}
const renderRelativeFilePathList = async (staticRoot, filePath) => {
  filePath = nodeModulePath.normalize(nodeModulePath.join(staticRoot, filePath))
  if (!filePath.includes(staticRoot)) throw new Error(`[error] list file out of staticRoot: ${filePath}`)
  const relativeFilePathList = await getRelativeFilePathList(nodeModulePath.join(filePath))
  const htmlFragList = relativeFilePathList.map((filePath) => `⬢ <a href="${formatFilePath(filePath)}">${escapeHTML(filePath)}</a>`)
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family: monospace">${htmlFragList.join('<br />')}</body></html>`
}
const formatFilePath = (filePath) => {
  filePath = nodeModulePath.join('/file', filePath)
  return encodeURI(nodeModulePath.sep === '\\' ? filePath.replace(/\\/g, '/') : filePath)
}
const getRelativeFilePathList = async (staticRoot) => { // The resulting path is normalized and trailing slashes are removed unless the path is resolved to the root directory.
  const filePathList = await getFileList(staticRoot, (fileList) => (path, name) => fileList.push(nodeModulePath.join(path, name)))
  return staticRoot.length >= 2
    ? filePathList.map((filePath) => filePath.slice(staticRoot.length + 1)) // staticRoot is not '/'
    : filePathList // staticRoot is '/'
}

main().catch(exitWithError)
