import { dirname } from 'node:path'
import { createWriteStream } from 'node:fs'
import { catchAsync } from 'source/common/error.js'
import { setTimeoutAsync } from 'source/common/time.js'
import { run } from 'source/node/run.js'
import { createDirectory } from 'source/node/fs/Directory.js'
import { resolveCommandAsync } from 'source/node/system/ResolveCommand.js'
import {
  getProcessListAsync,
  toProcessPidMap,
  toProcessTree, findProcessTreeInfo,
  killProcessTreeInfoAsync,
  isPidExist
} from 'source/node/system/Process.js'

const runWithAsyncFunc = async (argList, { asyncFunc, setupDelay = 500, ...option }) => {
  const { subProcess, promise } = run(argList, option)
  const exitPromise = promise.catch((error) => __DEV__ && console.log(`process exit with error: ${error}`))

  // wait for process setup
  await setTimeoutAsync(setupDelay) // wait for a bit for the process to start (usually npm)
  if (!isPidExist(subProcess.pid)) throw new Error('process exit too early')

  // capture process tree, for later process kill
  const processList = await getProcessListAsync()
  const subProcessInfo = toProcessPidMap(processList)[ subProcess.pid ]
  const { pid, command, subTree } = findProcessTreeInfo(subProcessInfo, toProcessTree(processList)) // drops ppid since sub tree may get chopped
  __DEV__ && console.log({ pid, command, subTree })

  const { result, error } = await catchAsync(asyncFunc, { subProcess, promise, pid })

  // process kill
  await killProcessTreeInfoAsync({ pid, command, subTree })
  await exitPromise

  if (error) throw error
  return result
}

const runWithTee = async (argList, option = {}, logFile) => { // output to both stdout and log file
  await createDirectory(dirname(logFile))
  const { promise, subProcess } = run(argList, { ...option, quiet: true, describeError: false })
  const logStream = createWriteStream(logFile)
  subProcess.stdout.pipe(process.stdout, { end: false })
  subProcess.stderr.pipe(process.stderr, { end: false })
  subProcess.stdout.pipe(logStream, { end: false })
  subProcess.stderr.pipe(logStream, { end: false })
  await promise
  subProcess.stdout.unpipe(process.stdout)
  subProcess.stderr.unpipe(process.stderr)
  subProcess.stdout.unpipe(logStream)
  subProcess.stderr.unpipe(logStream)
  logStream.end()
}

// do not support shell internal command (shell: false)
// after this should execute no more code
// borrowed logic: https://github.com/babel/babel/blob/v7.9.5/packages/babel-node/src/babel-node.js#L86-L99
const runPassThrough = async (argList, option) => {
  argList = [ ...argList ]
  argList[ 0 ] = await resolveCommandAsync(argList[ 0 ], option && option.cwd) // find full path, especially for win32
  const { promise, subProcess } = run(argList, option)
  SOFT_SIGNAL_LIST.forEach((signal) => process.on(signal, () => subProcess.kill(signal))) // pass through common events
  const { code } = await promise.catch((error) => error)
  if (code !== 0) process.exitCode = code || -1
}
const SOFT_SIGNAL_LIST = [
  'SIGINT', // 1, soft
  'SIGHUP', // 2, soft, ~10sec kill delay in Windows
  'SIGQUIT', // 3, soft
  // 'SIGKILL', // 9, hard, cannot have a listener installed
  'SIGTERM' // 15, soft
]

const withCwd = (pathCwd, taskAsync) => async (...args) => { // NOTE: to run command using env cwd only (not accept as input)
  const prevCwd = process.cwd()
  process.chdir(pathCwd)
  const { result, error } = await catchAsync(taskAsync, ...args)
  process.chdir(prevCwd)
  if (error) throw error
  return result
}

export {
  runWithAsyncFunc,
  runWithTee,
  runPassThrough,
  withCwd
}
