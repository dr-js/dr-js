import nodeModuleChildProcess from 'child_process'

const spawn = (command, argList = [], { cwd = process.cwd(), env = process.env, shell = true, detached = false, stdio = 'inherit' }) => {
  const childProcess = nodeModuleChildProcess.spawn(command, argList, { cwd, env, shell, detached, stdio })
  return {
    childProcess,
    childProcessPromise: new Promise((resolve, reject) => {
      childProcess.on('exit', (code, signal) => {
        __DEV__ && console.log('[Exit] code:', code, 'signal:', signal)
        resolve({ command, argList, code, signal })
      })
      childProcess.on('error', (error) => {
        __DEV__ && console.log('[Error] error:', error, error.stack && error.stack)
        reject(Object.assign(error, { command, argList, code: 1 })) // default error code
      })
    })
  }
}

const runCommand = (command) => {
  __DEV__ && console.log(`[runCommand] ${command}`)
  const { childProcess, childProcessPromise } = spawn(command, [], { stdio: [ 'ignore', 'pipe', 'pipe' ] })
  const stdoutChunkList = []
  const stderrChunkList = []
  childProcess.stdout.on('data', (chunk) => stdoutChunkList.push(chunk))
  childProcess.stderr.on('data', (chunk) => stderrChunkList.push(chunk))
  const onProcessEnd = (result) => { // result can be { command, argList, code, signal }, or error { message, command, argList, code: 1, signal }
    result.stdoutString = Buffer.concat(stdoutChunkList).toString()
    result.stderrString = Buffer.concat(stderrChunkList).toString()
    if (result.code === 0) return result // will throw non 0 exit code as error
    throw Object.assign(new Error(
      `[runCommand] code: ${result.code} signal: ${result.signal}\n` +
      `command:\n  ${command}\n` +
      (result.message ? `message:\n  ${result.message}\n` : '') +
      (result.stdoutString ? `output:\n  ${result.stdoutString.split('\n').join('\n  ')}\n` : '') +
      (result.stderrString ? `error:\n  ${result.stderrString.split('\n').join('\n  ')}` : '')
    ), result)
  }
  return childProcessPromise.then(onProcessEnd, onProcessEnd)
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

export { spawn, runCommand, withCwd }
