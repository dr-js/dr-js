import { setTimeoutAsync } from 'source/common/time'
import { autoEllipsis } from 'source/common/string'
import { padTable } from 'source/common/format'
import { createTreeDepthFirstSearch, createTreeBottomUpSearchAsync, prettyStringifyTree } from 'source/common/data/Tree'
import { run } from './Run'

const INIT_GET_PROCESS_LIST_ASYNC_MAP = () => {
  const parseTitleCol = (titleString) => { // a col means \w+\s+, or \s+\w+ (for this output), so every 2 \w\s flip means a col
    let flipCharType = titleString.charAt(0) === ' '
    let flipCount = 2
    const colStartIndexList = [ 0 ] // colStartIndex
    for (let index = 0, indexMax = titleString.length; index < indexMax; index++) {
      const charType = titleString.charAt(index) === ' '
      if (flipCharType === charType) continue
      flipCharType = !flipCharType
      flipCount--
      if (flipCount !== 0) continue
      colStartIndexList.push(index)
      flipCount = 2
    }
    return colStartIndexList
  }

  const parseRow = (rowString, colStartIndexList, keyList, valueProcessList) => {
    const itemMap = {}
    for (let index = 0, indexMax = colStartIndexList.length; index < indexMax; index++) {
      itemMap[ keyList[ index ] ] = valueProcessList[ index ](rowString.slice(
        colStartIndexList[ index ],
        colStartIndexList[ index + 1 ]
      ))
    }
    return itemMap
  }

  const parseTableOutput = (outputString, lineSeparator, keyList = [], valueProcessList = []) => {
    const [ titleLine, ...rowList ] = outputString.split(lineSeparator)
    const colStartIndexList = parseTitleCol(titleLine)
    if (colStartIndexList.length !== keyList.length) throw new Error(`title col mismatch: ${colStartIndexList.length}, expect: ${keyList.length}`)
    return rowList.map((rowString) => rowString && parseRow(rowString, colStartIndexList, keyList, valueProcessList)).filter(Boolean)
  }

  const createGetProcessListAsync = (commandString, lineSeparator, keyList, valueProcessList) => {
    const [ command, ...argList ] = commandString.split(' ')
    return async () => {
      const { promise, stdoutPromise } = run({ command, argList, quiet: true })
      await promise
      return parseTableOutput(String(await stdoutPromise), lineSeparator, keyList, valueProcessList)
    }
  }

  const valueProcessString = (string) => String(string).trim()
  const valueProcessInteger = (string) => parseInt(string)

  const ProcessListLinux = [
    'ps ax -ww -o pid,ppid,args',
    '\n',
    [ 'pid', 'ppid', 'command' ],
    [ valueProcessInteger, valueProcessInteger, valueProcessString ]
  ]
  const ProcessListAndroid = [ 'ps ax -o pid,ppid,args', ...ProcessListLinux.slice(1) ]
  const ProcessListWin32 = [
    'WMIC PROCESS get Commandline,ParentProcessId,Processid',
    '\r\r\n', // for WMIC `\r\r\n` output // check: https://stackoverflow.com/questions/24961755/batch-how-to-correct-variable-overwriting-misbehavior-when-parsing-output
    [ 'command', 'ppid', 'pid' ],
    [ valueProcessString, valueProcessInteger, valueProcessInteger ]
  ]

  const getProcessListAsyncLinux = createGetProcessListAsync(...ProcessListLinux)
  const getProcessListAsyncAndroid = createGetProcessListAsync(...ProcessListAndroid)
  const getProcessListAsyncWin32 = createGetProcessListAsync(...ProcessListWin32)

  Object.assign(GET_PROCESS_LIST_ASYNC_MAP, {
    INIT: true,
    linux: getProcessListAsyncLinux,
    win32: getProcessListAsyncWin32,
    darwin: getProcessListAsyncLinux,
    android: getProcessListAsyncAndroid
  })
}

const GET_PROCESS_LIST_ASYNC_MAP = {
  INIT: false,
  linux: null,
  win32: null,
  darwin: null,
  android: null
}

// NOTE: not a fast command (linux: ~100ms, win32: ~500ms)
const getProcessListAsync = () => {
  if (GET_PROCESS_LIST_ASYNC_MAP.INIT === false) INIT_GET_PROCESS_LIST_ASYNC_MAP()
  const getAsync = GET_PROCESS_LIST_ASYNC_MAP[ process.platform ]
  if (!getAsync) throw new Error(`unsupported platform: ${process.platform}`)
  return getAsync()
}

const PROCESS_LIST_SORT_MAP = {
  'pid++': (a, b) => a.pid - b.pid,
  'pid--': (a, b) => b.pid - a.pid,
  'ppid++': (a, b) => a.ppid - b.ppid || a.pid - b.pid,
  'ppid--': (a, b) => b.ppid - a.ppid || a.pid - b.pid
}
const sortProcessList = (processList, sortOrder = 'pid--') => processList.sort(PROCESS_LIST_SORT_MAP[ sortOrder ])

const toProcessPidMap = (processList) => (processList).reduce((o, info) => {
  o[ info.pid ] = info
  return o
}, {})

// const SAMPLE_PROCESS_TREE = {
//   pid: 0, ppid: -1, command: 'ROOT',
//   subTree: {
//     1: { ... }
//     2: { ... }
//   }
// }
const toProcessTree = (processList) => { // NOTE: will mutate processList (add `subTree` value)
  const rootInfo = { pid: 0, ppid: -1, command: 'ROOT' }
  const processMap = { 0: rootInfo }
  const subTreeMap = { 0: {} }
  for (const info of processList) {
    const { pid, ppid } = info
    if (pid === 0) continue // NOTE: win32 root process has { pid: 0, ppid: 0 }, linux do not (no pid: 0)
    processMap[ pid ] = info
    if (subTreeMap[ ppid ] === undefined) subTreeMap[ ppid ] = {}
    subTreeMap[ ppid ][ pid ] = info
  }

  processMap[ rootInfo.pid ] = rootInfo

  Object.entries(subTreeMap).forEach(([ ppid, subTree ]) => {
    let info = processMap[ ppid ]
    if (!info) { // root-less process, normally found in win32, will create a patch process to root
      info = { pid: ppid, ppid: rootInfo.pid, command: '' }
      subTreeMap[ info.ppid ][ info.pid ] = info
    }
    info.subTree = subTree
  })

  return rootInfo
}

const isInfoMatch = ({ pid, ppid, command }, info) => (
  info &&
  info.pid === pid &&
  (ppid === undefined || info.ppid === ppid) && // allow skip ppid check
  (command === undefined || info.command === command) // allow skip command check
)

const findProcessPidMapInfo = (info, processPidMap) => isInfoMatch(info, processPidMap[ info.pid ])
  ? processPidMap[ info.pid ]
  : undefined

const findProcessTreeInfo = (info, processTree) => processTreeDepthFirstSearch(
  processTree,
  (searchInfo) => isInfoMatch(info, searchInfo)
)

const killProcessInfoAsync = async (info) => { // TODO: may be too expensive?
  const isExistAsync = async () => isPidExist(info.pid) && findProcessPidMapInfo(info, toProcessPidMap(await getProcessListAsync()))

  if (!await isExistAsync()) return
  process.kill(info.pid)
  await setTimeoutAsync(500)
  if (!await isExistAsync()) return
  process.kill(info.pid) // 2nd try
  await setTimeoutAsync(2000)
  if (!await isExistAsync()) return
  process.kill(info.pid, 'SIGKILL') // last try
  await setTimeoutAsync(4000)
  if (!await isExistAsync()) return
  throw new Error(`failed to stop process, pid: ${info.pid}, ppid: ${info.ppid}, command: ${info.command}`)
}

const killProcessTreeInfoAsync = async (processTreeInfo, isMatchPpid = false) => {
  const killAsync = isMatchPpid
    ? killProcessInfoAsync
    : ({ pid, command }) => killProcessInfoAsync({ pid, command })
  await processTreeBottomUpSearchAsync(processTreeInfo, killAsync)
  await killAsync(processTreeInfo)
}

const getSubNodeListFunc = (info) => info.subTree && Object.values(info.subTree)
const processTreeDepthFirstSearch = createTreeDepthFirstSearch(getSubNodeListFunc)
const processTreeBottomUpSearchAsync = createTreeBottomUpSearchAsync(getSubNodeListFunc)

const getAllProcessStatusAsync = async (outputMode) => {
  const processList = await getProcessListAsync()
  return outputMode.startsWith('t') // tree|t|tree-wide|tw
    ? toProcessTree(processList)
    : sortProcessList(processList, outputMode)
}
const describeAllProcessStatusAsync = async (outputMode) => {
  const status = await getAllProcessStatusAsync(outputMode)
  if (outputMode.startsWith('t')) { // tree|t|tree-wide|tw
    const text = prettyStringifyProcessTree(status)
    return (outputMode !== 'tree-wide' && outputMode !== 'tw')
      ? text.split('\n').map((line) => autoEllipsis(line, 128, 96, 16)).join('\n')
      : text
  } else {
    return padTable({ table: [ [ 'pid', 'ppid', 'command' ], ...status.map(({ pid, ppid, command }) => [ pid, ppid, command ]) ] })
  }
}

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

const isPidExist = (pid) => {
  try {
    // This method will throw an error if the target pid does not exist. As a special case, a signal of 0 can be used to test for the existence of a process.
    // https://nodejs.org/api/process.html#process_process_kill_pid_signal
    // https://www.npmjs.com/package/is-running
    process.kill(pid, 0)
    return true
  } catch (error) {
    __DEV__ && console.warn('[isPidExist]', error)
    return false
  }
}

export {
  getProcessListAsync, sortProcessList,
  toProcessPidMap, findProcessPidMapInfo,
  toProcessTree, findProcessTreeInfo,
  killProcessInfoAsync, killProcessTreeInfoAsync,
  getAllProcessStatusAsync, describeAllProcessStatusAsync,
  isPidExist
}

// For linux: ps
// $ ps ax -ww -o pid,ppid,args
//   PID  PPID COMMAND
//     1     0 /lib/systemd/systemd --system --deserialize 40
//     2     0 [kthreadd]
//     4     2 [kworker/0:0H]
//    11     2 [watchdog/0]
//   159     2 [kworker/0:1H]
//   826     1 /usr/sbin/cron -f
//   831     1 /lib/systemd/systemd-logind
//   941     1 /usr/sbin/atd -f
//  1078     1 /usr/lib/policykit-1/polkitd --no-debug
// 16542     2 [kworker/0:2]
// 17252 31221 sshd: root@pts/0
// 17254     1 /lib/systemd/systemd --user
// 17265 17252 -bash
// 17278 17265 ps ax -ww -o pid,ppid,args

// For win32: WMIC
// > WMIC PROCESS get Commandline,ParentProcessId,Processid
// CommandLine                                                                                                ParentProcessId  ProcessId
//                                                                                                            0                0
//                                                                                                            0                4
// c:\windows\system32\svchost.exe -k unistacksvcgroup -s CDPUserSvc                                          824              5220
// c:\windows\system32\svchost.exe -k unistacksvcgroup                                                        824              13304
// "C:\Windows\ImmersiveControlPanel\SystemSettings.exe" -ServerName:microsoft.windows.immersivecontrolpanel  996              1876
// C:\WINDOWS\system32\ApplicationFrameHost.exe -Embedding                                                    996              8440
// C:\Windows\System32\RuntimeBroker.exe -Embedding                                                           996              13132
// "C:\Program Files\Realtek\Audio\HDA\RAVBg64.exe" /IM                                                       1656             3372
// sihost.exe                                                                                                 1944             11928
// C:\WINDOWS\Explorer.EXE                                                                                    8596             13112
// "C:\Program Files\Synaptics\SynTP\SynTPEnh.exe"                                                            12380            11124
