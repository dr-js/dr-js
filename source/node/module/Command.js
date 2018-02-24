import { spawn as spawnProcess } from 'child_process'
import { stringIndentLine } from 'source/common/format'

const spawn = (command, argList = [], option) => {
  const subProcess = spawnProcess(command, argList, { stdio: 'inherit', shell: true, ...option })
  const promise = new Promise((resolve, reject) => {
    subProcess.on('error', (error) => reject(Object.assign(error, { command, argList, code: 1, signal: 'process error' }))) // default error code
    subProcess.on('exit', (code, signal) => code !== 0
      ? reject(Object.assign(new Error(`non-zero exit code: ${code}, signal: ${signal}`), { command, argList, code, signal }))
      : resolve({ command, argList, code, signal }))
  })
  return {
    subProcess,
    promise
  }
}

const exec = (command, option) => {
  __DEV__ && console.log(`[exec] ${command}`)
  const { subProcess: { stdout, stderr }, promise } = spawn(command, [], { stdio: [ 'ignore', 'pipe', 'pipe' ], ...option })
  const stdoutChunkList = []
  const stderrChunkList = []
  stdout.on('data', (chunk) => stdoutChunkList.push(chunk))
  stderr.on('data', (chunk) => stderrChunkList.push(chunk))
  const onProcessEnd = (result) => { // result can be also be error with { command, argList, code, signal }
    result.stdout = Buffer.concat(stdoutChunkList).toString()
    result.stderr = Buffer.concat(stderrChunkList).toString()
    if (result.code === 0) return result // will throw non 0 exit code as error
    const { command, argList, code, signal, stderr, stdout, message } = result
    throw Object.assign(new Error([
      `[exec] code: ${code} signal: ${signal}`, 'command:', `  ${command}`,
      ...(message ? [ 'message:', stringIndentLine(message, '  ') ] : []),
      ...(stderr ? [ 'stderr:', stringIndentLine(stderr, '  ') ] : []),
      ...(stdout ? [ 'stdout:', stringIndentLine(stdout, '  ') ] : [])
    ].join('\n')), { command, argList, code, signal, stderr, stdout })
  }
  return promise.then(onProcessEnd, onProcessEnd)
}

const withCwd = (cwd, taskAsync) => async (...args) => {
  const prevCwd = process.cwd()
  process.chdir(cwd)
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
  spawn,
  exec,
  withCwd
}
