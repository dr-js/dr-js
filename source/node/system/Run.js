import { spawn, spawnSync } from 'child_process'
import { catchAsync } from 'source/common/error'
import { readableStreamToBufferAsync } from 'source/node/data/Stream'

const getOption = (option, quiet) => ({
  stdio: quiet ? [ 'ignore', 'pipe', 'pipe' ] : 'inherit',
  shell: false,
  ...option
})
const getExitError = (error, exitData) => Object.assign(
  error || new Error(`exit code: ${exitData.code || '?'}, signal: ${exitData.signal || 'process error'}`),
  exitData
)

const run = ({ command, argList = [], option, quiet = false }) => {
  const subProcess = spawn(command, argList, getOption(option, quiet))
  const stdoutPromise = quiet ? readableStreamToBufferAsync(subProcess.stdout) : undefined
  const stderrPromise = quiet ? readableStreamToBufferAsync(subProcess.stderr) : undefined
  const promise = new Promise((resolve, reject) => {
    subProcess.on('error', (error) => reject(getExitError(error, { command, argList, stdoutPromise, stderrPromise }))) // default error code
    subProcess.on('exit', (code, signal) => {
      const data = { command, argList, code, signal, stdoutPromise, stderrPromise }
      if (code !== 0) reject(getExitError(null, data))
      else resolve(data)
    })
  })
  return { subProcess, promise, stdoutPromise, stderrPromise }
}

const runSync = ({ command, argList = [], option, quiet = false }) => {
  const { error, status: code, signal, stdout, stderr } = spawnSync(command, argList, getOption(option, quiet))
  const data = { command, argList, code, signal, stdout, stderr }
  if (error || code) throw getExitError(error, data)
  return data
}

const withCwd = (pathCwd, taskAsync) => async (...args) => {
  const prevCwd = process.cwd()
  process.chdir(pathCwd)
  const { result, error } = await catchAsync(taskAsync, ...args)
  process.chdir(prevCwd)
  if (error) throw error
  return result
}

export {
  run,
  runSync,
  withCwd
}
