import nodeModuleChildProcess from 'child_process'

function spawn (command, argList = [], { cwd = process.cwd(), env = process.env, shell = true, detached = false, stdio = 'inherit' }) {
  const childProcess = nodeModuleChildProcess.spawn(command, argList, { cwd, env, shell, detached, stdio })
  return {
    childProcess,
    childProcessPromise: new Promise((resolve, reject) => {
      childProcess.on('exit', (code, signal) => {
        __DEV__ && console.log('[Exit] code:', code, 'signal:', signal)
        resolve({ code, signal })
      })
      childProcess.on('error', (error) => {
        __DEV__ && console.log('[Error] error:', error, error.stack && error.stack)
        reject(error)
      })
    })
  }
}

const run = process.platform.includes('win') ? (command, options) => spawn('cmd', [ '/s', '/c', command ], options)
  : (process.platform.includes('nux') || process.platform.includes('darwin')) ? (command, options) => spawn('sh', [ '-c', command ], options)
    : () => { throw new Error(`[run] unrecognized platform: ${process.platform}`) }

function runCommand (command) {
  const { childProcess, childProcessPromise } = run(command, { stdio: [ 'ignore', 'pipe', 'pipe' ] })
  const stdoutChunkList = []
  const stderrChunkList = []
  childProcess.stdout.on('data', (chunk) => stdoutChunkList.push(chunk))
  childProcess.stderr.on('data', (chunk) => stderrChunkList.push(chunk))
  return childProcessPromise.then(({ code, signal }) => ({
    code,
    signal,
    stdoutString: Buffer.concat(stdoutChunkList).toString(),
    stderrString: Buffer.concat(stderrChunkList).toString()
  }))
}

export {
  spawn,
  run,
  runCommand
}
