import { openSync, closeSync } from 'node:fs'
import { spawn, spawnSync } from 'node:child_process'
import { remessageError } from 'source/common/error.js'
import { readableStreamToBufferAsync } from 'source/node/data/Stream.js'

const getOption = (option, quiet) => ({
  stdio: quiet ? [ 'ignore', 'pipe', 'pipe' ] : 'inherit',
  // shell: false, // default // this is the only sane way to run something, else it's quoting soup
  ...option
})
const toRunError = (error, exitData) => Object.assign(
  error || new Error(`exit with code: ${exitData.code}, signal: ${exitData.signal}`),
  exitData
)

const describeRunOutcome = (data) => data.describeOutcome || ( // prevent "double-describe"
  data.stdoutPromise
    ? Promise.all([ data.stdoutPromise, data.stderrPromise ]).then(([ stdout, stderr ]) => describeRunOutcomeSync(Object.assign(data, { stdout, stderr }))) // async + quiet, from `run`
    : describeRunOutcomeSync(data) // not quiet, or sync from `runSync`
)

const describeRunOutcomeSync = (data) => {
  if (data.describeOutcome === undefined) { // prevent "double-describe"
    const {
      message, stack, // from JS error
      code, signal, // from process error
      command, argList = [],
      stdout, stderr // , stdoutPromise, stderrPromise // maybe missing for process with stdio inherit
    } = data
    data.describeOutcome = [
      stack || message, // in V8, the stack contains the message, so just use the stack if found
      signal !== undefined && `[code] ${code} [signal] ${signal}`,
      `[args] ${quote(command)} ${argList.map(quote).join(' ')}`,
      stdout && stdout.length && `[stdout] ${stdout}`,
      stderr && stderr.length && `[stderr] ${stderr}`
    ].filter(Boolean).join('\n')
  }
  return data.describeOutcome
}
const quote = (v) => JSON.stringify(v)

const run = ([ command, ...argList ], {
  quiet = false,
  describeError = quiet, // auto describe error, then output is collected
  ...option
} = {}) => { // NOTE: describeError may await once more and alter stacktrace
  const subProcess = spawn(command, argList, getOption(option, quiet))
  const stdoutPromise = quiet ? readableStreamToBufferAsync(subProcess.stdout) : undefined
  const stderrPromise = quiet ? readableStreamToBufferAsync(subProcess.stderr) : undefined
  const getExitData = () => ({ code: subProcess.exitCode, signal: subProcess.signalCode, command, argList, stdoutPromise, stderrPromise })
  let promise = new Promise((resolve, reject) => {
    subProcess.on('error', (error) => reject(toRunError(error, getExitData()))) // default error code
    subProcess.on('exit', (code, signal) => code === 0 ? resolve(getExitData()) : reject(toRunError(null, getExitData())))
  })
  if (describeError) promise = promise.catch(async (error) => { throw remessageError(error, await describeRunOutcome(error)) })
  return { subProcess, promise, stdoutPromise, stderrPromise }
}

const runSync = ([ command, ...argList ], {
  quiet = false,
  describeError = quiet, // auto describe error, then output is collected
  ...option
} = {}) => {
  const { error, status: code, signal, stdout, stderr } = spawnSync(command, argList, getOption(option, quiet))
  const exitData = { code, signal, command, argList, stdout, stderr }
  if (code !== 0) {
    const runError = toRunError(error, exitData)
    throw (describeError ? remessageError(runError, describeRunOutcomeSync(runError)) : runError)
  } else return exitData
}

const runDetached = ([ command, ...argList ], {
  stdoutFile = '', // if not set, stdout will be dropped
  stderrFile = stdoutFile, // if not set, stderr will be dropped
  stdoutFd = stdoutFile && openSync(stdoutFile, 'a'),
  stderrFd = (stderrFile && stderrFile !== stdoutFile) ? openSync(stderrFile, 'a') : stdoutFd,
  ...option
} = {}) => {
  const subProcess = spawn(command, argList, {
    detached: true,
    stdio: stdoutFd ? [ 'ignore', stdoutFd, stderrFd ] : 'ignore',
    ...option
  })
  subProcess.on('error', (error) => { __DEV__ && console.log('[ERROR|runDetached]', error) }) // NOTE: the process failed to run, due to ENOENT (command not found)
  subProcess.unref()
  stdoutFd && closeSync(stdoutFd)
  stderrFd && stderrFd !== stdoutFd && closeSync(stderrFd)
  return { subProcess }
}

const runStdout = async (argList = [], option) => {
  const { promise, stdoutPromise } = run(argList, { quiet: true, ...option })
  await promise
  return stdoutPromise
}
const runStdoutSync = (argList = [], option) => runSync(argList, { quiet: true, ...option }).stdout // TODO: NOTE: maybe not as useful as `String(spawnSync(cmd, [], {}).stdout || '')`

export {
  describeRunOutcome, describeRunOutcomeSync,
  run, runStdout,
  runSync, runStdoutSync,
  runDetached
}
