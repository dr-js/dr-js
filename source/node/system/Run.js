import { spawn, spawnSync } from 'child_process'
import { receiveBufferAsync } from 'source/node/data/Buffer'

const getExitError = (error, exitData) => Object.assign(
  error || new Error(`non-zero exit code: ${exitData.code}, signal: ${exitData.signal}`),
  exitData
)

const run = ({ command, argList = [], option }) => {
  const subProcess = spawn(command, argList, { stdio: 'inherit', shell: true, ...option })
  const promise = new Promise((resolve, reject) => {
    subProcess.on('error', (error) => reject(getExitError(error, { command, argList, code: 1, signal: 'process error' }))) // default error code
    subProcess.on('exit', (code, signal) => code !== 0
      ? reject(getExitError(null, { command, argList, code, signal }))
      : resolve({ command, argList, code, signal }))
  })
  return { subProcess, promise }
}

const runSync = ({ command, argList = [], option }) => {
  const { status: code, signal, error } = spawnSync(command, argList, { stdio: 'inherit', shell: true, ...option })
  if (error || code) throw getExitError(error, { command, argList, code, signal })
  return { command, argList, code, signal }
}

const runQuiet = (runConfig) => {
  runConfig.config = { stdio: [ 'ignore', 'pipe', 'pipe' ], ...runConfig.config }
  const { subProcess: { stdout, stderr }, promise } = run(runConfig)
  const stdoutBufferPromise = receiveBufferAsync(stdout)
  const stderrBufferPromise = receiveBufferAsync(stderr)
  return promise.then(
    (result) => Object.assign(result, { stdoutBufferPromise, stderrBufferPromise }),
    (error) => { throw Object.assign(error, { stdoutBufferPromise, stderrBufferPromise }) }
  )
}

const withCwd = (pathCwd, taskAsync) => async (...args) => {
  const prevCwd = process.cwd()
  process.chdir(pathCwd)
  try {
    const result = await taskAsync(...args)
    process.chdir(prevCwd)
    return result
  } catch (error) {
    process.chdir(prevCwd)
    throw error
  }
}

export {
  run,
  runSync,
  runQuiet,
  withCwd
}
