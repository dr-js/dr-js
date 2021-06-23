import { setTimeoutAsync } from 'source/common/time.js'
import { autoEllipsis } from 'source/common/string.js'
import { binary, padTable } from 'source/common/format.js'
import { createTreeDepthFirstSearch, createTreeBottomUpSearchAsync, prettyStringifyTreeNode } from 'source/common/data/Tree.js'
import { run } from 'source/node/run.js'

const INIT_GET_PROCESS_LIST_ASYNC_MAP = () => {
  const parseTitleCol = (titleString) => { // a col means \w+\s+, or \s+\w+ (for this output), so every 2 \w\s flip means a col
    let flipCharType = titleString.charAt(0) === ' '
    let flipCount = 0
    const colStartIndexList = [ 0 ] // colStartIndex
    for (let index = 0, indexMax = titleString.length; index < indexMax; index++) {
      if (flipCharType === (titleString.charAt(index) === ' ')) continue
      flipCharType = !flipCharType
      flipCount++
      if (flipCount % 2 === 0) colStartIndexList.push(index)
    }
    return colStartIndexList
  }

  const parseRow = (rowString, colStartIndexList, itemList = []) => {
    for (let index = 0, indexMax = colStartIndexList.length; index < indexMax; index++) {
      itemList.push(rowString.slice(colStartIndexList[ index ], colStartIndexList[ index + 1 ]))
    }
    return itemList // list of string
  }

  const parseTableOutput = (outputString, lineSeparator, itemSwapFunc = (v) => v, processList = []) => {
    const [ titleLine, ...rowList ] = outputString.split(lineSeparator).filter(Boolean)
    const colStartIndexList = parseTitleCol(titleLine)
    rowList.forEach((rowString) => {
      const [ pid, ppid, memory, command ] = itemSwapFunc(parseRow(rowString, colStartIndexList))
      processList.push({ pid: parseInt(pid), ppid: parseInt(ppid), memory: parseInt(memory), command: command.trim() }) // NOTE: the memory is approximated
    })
    return processList
  }

  const createGetProcessListAsync = (commandString, lineSeparator, itemSwapFunc) => {
    const argList = commandString.split(' ')
    return async () => {
      const { promise, stdoutPromise } = run(argList, { quiet: true, describeError: true })
      await promise
      return parseTableOutput(String(await stdoutPromise), lineSeparator, itemSwapFunc)
    }
  }

  const getProcessListAsyncLinux = createGetProcessListAsync(
    'ps -wweo pid,ppid,rss=MEMORY__,args', // https://ss64.com/bash/ps.html // https://www.unix.com/man-page/osx/1/ps/ // set rss title to `MEMORY__` so it will keep aligned, unless rss is 95+GiB
    '\n',
    ([ pid, ppid, rss, command ]) => [ pid, ppid, parseInt(rss) * 1024, command ] // NOTE: `rss` is in KiB
  )
  const getProcessListAsyncWin32 = createGetProcessListAsync(
    'WMIC PROCESS get Commandline,Name,ParentProcessId,ProcessId,WorkingSetSize', // NOTE: the output order is locked, regardless of the query order // use `WMIC PROCESS GET -?:FULL` for key list
    '\r\r\n', // for WMIC `\r\r\n` output // check: https://stackoverflow.com/questions/24961755/batch-how-to-correct-variable-overwriting-misbehavior-when-parsing-output
    ([ command, name, ppid, pid, wss ]) => [ pid, ppid, wss, command.trim() || name ] // NOTE: use name for some process without a command
  )

  Object.assign(GET_PROCESS_LIST_ASYNC_MAP, {
    INIT: true,
    linux: getProcessListAsyncLinux,
    win32: getProcessListAsyncWin32,
    darwin: getProcessListAsyncLinux,
    android: getProcessListAsyncLinux
  })
}

const GET_PROCESS_LIST_ASYNC_MAP = {
  INIT: false,
  linux: null,
  win32: null,
  darwin: null,
  android: null
}

// NOTE: not a fast command (linux: ~50ms, win32: ~200ms)
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
  'ppid--': (a, b) => b.ppid - a.ppid || a.pid - b.pid,
  'memory++': (a, b) => a.memory - b.memory,
  'memory--': (a, b) => b.memory - a.memory
}
const sortProcessList = (processList, sortOrder = 'pid--') => processList.sort(PROCESS_LIST_SORT_MAP[ sortOrder ])

const toProcessPidMap = (processList) => (processList).reduce((o, info) => {
  o[ info.pid ] = info
  return o
}, {})

// const SAMPLE_PROCESS_TREE = {
//   pid: 0, ppid: -1, memory: 0, command: 'ROOT',
//   subTree: {
//     1: { ... }
//     2: { ... }
//   }
// }
const toProcessTree = (processList) => { // NOTE: will mutate processList (add `subTree: {}` attribute)
  const rootInfo = { pid: 0, ppid: -1, memory: 0, command: 'ROOT' }
  const processMap = { 0: rootInfo }
  const subTreeMap = { 0: {} }
  for (const info of processList) {
    const { pid, ppid } = info
    if (pid === 0) continue // NOTE: win32 have { pid: 0, ppid: 0 }, but linux do not (no pid: 0), just merge both to rootInfo
    processMap[ pid ] = info
    if (subTreeMap[ ppid ] === undefined) subTreeMap[ ppid ] = {}
    subTreeMap[ ppid ][ pid ] = info
  }

  processMap[ rootInfo.pid ] = rootInfo

  Object.entries(subTreeMap).forEach(([ ppid, subTree ]) => {
    let info = processMap[ ppid ]
    if (!info) { // root-less process, normally found in win32, will create a patch process to root
      info = { pid: ppid, ppid: rootInfo.pid, memory: 0, command: '...' }
      subTreeMap[ info.ppid ][ info.pid ] = info
    }
    info.subTree = subTree
  })

  return rootInfo
}

const flattenProcessTree = (processTree, processList = []) => { // the root info will not be in list // mostly used to flatten subTree
  processTreeDepthFirstSearch(
    processTree,
    (info) => { processList.push(info) }
  )
  return processList
}

const isInfoMatch = ({ pid, ppid, command }, info) => (
  info &&
  info.pid === pid &&
  (ppid === undefined || info.ppid === ppid) && // allow skip ppid check
  (command === undefined || info.command === command) // allow skip command check
)

const findProcessListInfo = (info, processList) => processList.find((v) => isInfoMatch(info, v))

const findProcessPidMapInfo = (info, processPidMap) => isInfoMatch(info, processPidMap[ info.pid ])
  ? processPidMap[ info.pid ]
  : undefined

const findProcessTreeInfo = (info, processTree) => processTreeDepthFirstSearch(
  processTree,
  (searchInfo) => isInfoMatch(info, searchInfo)
)

const killProcessInfoAsync = async (info) => { // TODO: may be too expensive?
  const isExistAsync = async () => isPidExist(info.pid) && findProcessListInfo(info, await getProcessListAsync()) // check again after getting processList
  for (const [ wait, signal ] of [
    [ 50 ], [ 100 ], [ 250 ], [ 500 ], [ 500 ],
    [ 1000, 'SIGKILL' ] // last try
  ]) {
    if (!await isExistAsync()) return // killed
    try { process.kill(info.pid, signal) } catch (error) { __DEV__ && console.log('', error) }
    await setTimeoutAsync(wait)
  }
  if (!await isExistAsync()) return // killed
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
    if (outputMode === 'tree-wide' | outputMode === 'tw') return text
    else return text.split('\n').map((line) => autoEllipsis(line, 128, 96, 16)).join('\n')
  } else {
    return padTable({
      table: [
        [ 'PID', 'PPID', 'MEMORY', 'COMMAND' ],
        ...status.map(({ pid, ppid, memory, command }) => [ pid, ppid, memory, command ])
      ],
      padFuncList: [ 'R', 'R', 'R', 'L' ]
    })
  }
}

const prettyStringifyProcessTree = (processRootInfo) => {
  const resultList = []
  const pad = (value, count) => `${value}`.padStart(count, ' ')
  const padMemory = (value) => pad(value === -1 ? 'MEMORY' : `${binary(value)}B`, 10)
  const addLine = (prefix, { pid, memory, command }) => resultList.push(`${pad(pid, 8)} ${padMemory(memory)} ${prefix}${command}`) // 64bit system may have 7digit pid?
  addLine('', { pid: 'PID', memory: -1, command: 'COMMAND' })
  prettyStringifyTreeNode(
    ([ info, level, hasMore ]) => info.subTree && Object.values(info.subTree).map((subInfo, subIndex, { length }) => [ subInfo, level + 1, subIndex !== length - 1 ]),
    [ processRootInfo, -1, false ],
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
    // NOTE: on linux non-root user may get EPERM (Permission denied) checking a root process, instead of `ESRCH`,
    //   so `EPERM` also means pid exist, but this case you can not `SIGTERM` it
    //   also this is a best-effort detect, so a false may still not mean no process
    return error.code === 'EPERM'
  }
}

export {
  getProcessListAsync, sortProcessList, findProcessListInfo,
  toProcessPidMap, findProcessPidMapInfo,
  toProcessTree, findProcessTreeInfo, flattenProcessTree,
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
