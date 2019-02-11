import { readFileSync } from 'fs'
import { cpus } from 'os'

import { getEndianness } from 'dr-js/module/env/function'

import { createStepper } from 'dr-js/module/common/time'
import { time, decimal, padTable } from 'dr-js/module/common/format'
import { indentList, autoEllipsis } from 'dr-js/module/common/string'
import { prettyStringifyTree } from 'dr-js/module/common/data/Tree'

import { fetchLikeRequest } from 'dr-js/module/node/net'
import { createReadlineFromFileAsync } from 'dr-js/module/node/file/function'
import { getFileList, getDirectorySubInfoList, getDirectoryInfoTree } from 'dr-js/module/node/file/Directory'

import { createServer, createRequestListener } from 'dr-js/module/node/server/Server'
import { responderEnd, createResponderLog, createResponderLogEnd } from 'dr-js/module/node/server/Responder/Common'
import { createResponderFavicon } from 'dr-js/module/node/server/Responder/Send'
import { createResponderRouter, createRouteMap } from 'dr-js/module/node/server/Responder/Router'

import { getNetworkIPv4AddressList } from 'dr-js/module/node/system/NetworkAddress'
import { getProcessList, sortProcessList, getProcessTree } from 'dr-js/module/node/system/ProcessStatus'

import { name as packageName, version as packageVersion } from '../package.json'

const getVersion = () => ({
  packageName,
  packageVersion,
  platform: process.platform,
  nodeVersion: process.version,
  processorArchitecture: process.arch,
  processorEndianness: getEndianness(),
  processorCount: (cpus() || [ 'TERMUX FIX' ]).length // TODO: fix Termux, check: https://github.com/termux/termux-app/issues/299
})

const evalScript = async (
  evalScriptString, // inputFile ? readFileSync(inputFile).toString() : argumentList[ 0 ]
  evalArgv, // inputFile ? argumentList : argumentList.slice(1)
  evalCwd, // inputFile ? dirname(inputFile) : process.cwd()
  evalOption // optionData
) => { // NOTE: use eval not Function to allow require() to be called
  const scriptFunc = await eval(`(evalArgv, evalCwd, evalOption) => { ${evalScriptString} }`) // eslint-disable-line no-eval
  return scriptFunc(evalArgv, evalCwd, evalOption) // NOTE: both evalArgv / argumentList is accessible from eval
}

const evalReadlineExtend = async (result, readlineFile, log) => {
  __DEV__ && console.log('[eval-readline] result', result)
  const {
    onLineSync, // (lineString, lineCounter) => {}
    getResult, // () => 'result'
    logLineInterval = 0 // set number to log line & time
  } = result
  let lineCounter = 0
  let lineString = ''
  const stepper = logLineInterval && createStepper()
  const logLineCheck = logLineInterval
    ? () => (lineCounter % logLineInterval === 0) && log(`line: ${decimal(lineCounter)} (+${time(stepper())})`)
    : () => {}
  await createReadlineFromFileAsync(readlineFile, (string) => {
    lineString = string
    logLineCheck()
    onLineSync(lineString, lineCounter)
    lineCounter++
  })
  return getResult()
}

const fetchWithJump = async (
  initialUrl,
  option = {},
  jumpMax = 0, // 0 for unlimited jump
  onFetchStart // = (url, jumpCount, cookieList) => {}
) => {
  let url = initialUrl
  let jumpCount = 0
  let cookieList = (option.headers && option.headers.cookie) ? [ option.headers.cookie ] : []
  while (true) {
    onFetchStart && await onFetchStart(url, jumpCount, cookieList)
    const response = await fetchLikeRequest(url, { ...option, headers: { ...option.headers, 'cookie': cookieList.join(';') } })
    const getInfo = () => JSON.stringify({ url, status: response.status, headers: response.headers }, null, 2)
    if (response.ok) return response
    else if (response.status >= 300 && response.status <= 399 && response.headers[ 'location' ]) {
      jumpCount++
      if (jumpCount > jumpMax) throw new Error(`[fetch] ${jumpMax} max jump reached: ${getInfo()}`)
      url = new URL(response.headers[ 'location' ], url).href
      cookieList = [ ...cookieList, ...(response.headers[ 'set-cookie' ] || []).map((v) => v.split(';')[ 0 ]) ]
    } else throw new Error(`[fetch] bad status: ${getInfo()}`)
  }
}

const prettyStringifyFileTree = async (rootPath) => {
  const { subInfoListMap } = await getDirectoryInfoTree(rootPath)
  const resultList = []
  const addLine = (prefix, [ , name ]) => resultList.push(`${prefix}${name}`)
  prettyStringifyTree(
    [ [ rootPath, 'NAME' ], -1, false ],
    ([ [ path ], level, hasMore ]) => subInfoListMap[ path ] && subInfoListMap[ path ].map(
      ({ path: subPath, name }, subIndex, { length }) => [ [ subPath, name ], level + 1, subIndex !== length - 1 ]
    ),
    addLine
  )
  return resultList.join('\n')
}

const collectFile = async (modeName, rootPath) => modeName === 'file-list' ? (await getDirectorySubInfoList(rootPath)).map(({ name, stat }) => stat.isDirectory() ? `${name}/` : name)
  : modeName === 'file-list-all' ? getFileList(rootPath)
    : modeName === 'file-tree' ? prettyStringifyFileTree(rootPath)
      : ''

const prettyStringifyProcessTree = (processRootInfo) => {
  const resultList = []
  const addLine = (prefix, { pid, command }) => resultList.push(`${`${pid}`.padStart(8, ' ')} | ${prefix}${command || '...'}`) // 64bit system may have 7digit pid?
  addLine('', { pid: 'pid', command: 'command' })
  prettyStringifyTree(
    [ processRootInfo, -1, false ],
    ([ info, level, hasMore ]) => info.subTree && Object.values(info.subTree).map((subInfo, subIndex, { length }) => [ subInfo, level + 1, subIndex !== length - 1 ]),
    addLine
  )
  return resultList.join('\n')
}

const collectAllProcessStatus = async (outputMode, isHumanReadableOutput) => {
  if (outputMode.startsWith('t')) { // tree|t|tree-wide|tw
    const processRootInfo = await getProcessTree()
    if (!isHumanReadableOutput) return processRootInfo
    const text = prettyStringifyProcessTree(processRootInfo)
    return (outputMode !== 'tree-wide' && outputMode !== 'tw')
      ? text.split('\n').map((line) => autoEllipsis(line, 128, 96, 16)).join('\n')
      : text
  }
  const processList = sortProcessList(await getProcessList(), outputMode)
  return isHumanReadableOutput
    ? padTable({ table: [ [ 'pid', 'ppid', 'command' ], ...processList.map(({ pid, ppid, command }) => [ pid, ppid, command ]) ] })
    : processList
}

const describeServer = ({ baseUrl, protocol, hostname, port }, title, extraList = []) => indentList(`[${title}]`, [
  `pid: ${process.pid}`,
  ...extraList,
  `baseUrl: '${baseUrl}'`,
  hostname === '0.0.0.0' && indentList('localUrl:', [
    { address: 'localhost' },
    ...getNetworkIPv4AddressList()
  ].map(({ address }) => `'${protocol}//${address}:${port}'`))
].filter(Boolean))

const commonStartServer = async ({ protocol, hostname, port, routeConfigList, isAddFavicon, title, extraInfoList, log }) => {
  const { server, option, start, stop } = createServer({ protocol, hostname, port })
  const responderLogEnd = createResponderLogEnd({ log })
  if (isAddFavicon) routeConfigList = [ ...routeConfigList, [ [ '/favicon', '/favicon.ico' ], 'GET', createResponderFavicon() ] ]
  server.on('request', createRequestListener({
    responderList: [
      createResponderLog({ log }),
      createResponderRouter({ routeMap: createRouteMap(routeConfigList), baseUrl: option.baseUrl })
    ],
    responderEnd: (store) => {
      responderEnd(store)
      responderLogEnd(store)
    }
  }))
  await start()
  log(describeServer(option, title, extraInfoList))
  return { server, option, start, stop }
}

const getDrBrowserScriptHTML = () => `<script>${readFileSync(`${__dirname}/../library/Dr.browser.js`)}</script>`

export {
  packageName,
  packageVersion,

  getVersion,

  evalScript,
  evalReadlineExtend,

  fetchWithJump,

  collectFile,
  collectAllProcessStatus,

  describeServer,
  commonStartServer,
  getDrBrowserScriptHTML
}
