import { spawn, spawnSync } from 'child_process'
import { catchAsync } from 'source/common/error'
import { readableStreamToBufferAsync } from 'source/node/data/Stream'

const getOption = (option, quiet) => ({
  stdio: quiet ? [ 'ignore', 'pipe', 'pipe' ] : 'inherit',
  shell: false, // this is the only sane way to run something
  ...option
})
const toRunError = (error, exitData) => Object.assign(
  error || new Error(`exit with code: ${exitData.code}, signal: ${exitData.signal}`),
  exitData
)

const describeRunOutcome = (data) => data.stdoutPromise
  ? Promise.all([ data.stdoutPromise, data.stderrPromise ]).then(([ stdout, stderr ]) => describeRunOutcomeSync(Object.assign(data, { stdout, stderr }))) // async, from `run`
  : describeRunOutcomeSync(data) // sync from `runSync`

const describeRunOutcomeSync = ({
  message, stack, // from JS error
  code, signal, // from process error
  command, argList,
  stdout, stderr // , stdoutPromise, stderrPromise // maybe missing for process with stdio inherit
}) => [
  message && `[message] ${message}`,
  stack && `[stack] ${stack}`,
  signal !== undefined && `[code] ${code} [signal] ${signal}`,
  `[command] ${command} [argList] ${argList.map((v) => JSON.stringify(v)).join(' ')}`,
  stdout && stdout.length && `[stdout] ${stdout}`,
  stderr && stderr.length && `[stderr] ${stderr}`
].filter(Boolean).join('\n')

const run = ({ command, argList = [], option, quiet = false, describeError = false }) => { // NOTE: describeError may await once more and alter stacktrace
  const subProcess = spawn(command, argList, getOption(option, quiet))
  const stdoutPromise = quiet ? readableStreamToBufferAsync(subProcess.stdout) : undefined
  const stderrPromise = quiet ? readableStreamToBufferAsync(subProcess.stderr) : undefined
  let promise = new Promise((resolve, reject) => {
    subProcess.on('error', (error) => reject(toRunError(error, { command, argList, stdoutPromise, stderrPromise }))) // default error code
    subProcess.on('exit', (code, signal) => {
      const data = { code, signal, command, argList, stdoutPromise, stderrPromise }
      if (code !== 0) reject(toRunError(null, data))
      else resolve(data)
    })
  })
  if (describeError) promise = promise.catch(async (error) => { throw new Error(await describeRunOutcome(error)) })
  return { subProcess, promise, stdoutPromise, stderrPromise }
}

const runSync = ({ command, argList = [], option, quiet = false, describeError = false }) => {
  const { error, status: code, signal, stdout, stderr } = spawnSync(command, argList, getOption(option, quiet))
  const data = { code, signal, command, argList, stdout, stderr }
  if (error || (code !== 0)) {
    const runError = toRunError(error, data)
    throw (describeError ? new Error(describeRunOutcomeSync(runError)) : runError)
  }
  return data
}

const withCwd = (pathCwd, taskAsync) => async (...args) => { // TODO: DEPRECATE: seems unused
  const prevCwd = process.cwd()
  process.chdir(pathCwd)
  const { result, error } = await catchAsync(taskAsync, ...args)
  process.chdir(prevCwd)
  if (error) throw error
  return result
}

export {
  describeRunOutcome, describeRunOutcomeSync,
  run, runSync,

  withCwd // TODO: DEPRECATE: seems unused
}
