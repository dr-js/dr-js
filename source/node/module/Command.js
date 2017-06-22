import nodeModuleOs from 'os'
import nodeModuleChildProcess from 'child_process'

const PLATFORM = nodeModuleOs.platform()

function spawn (command, argList = [], { cwd = process.cwd(), env = process.env, shell = true, detached = false, stdio = 'inherit' }) {
  const childProcess = nodeModuleChildProcess.spawn(command, argList, { cwd, env, shell, detached, stdio }) // Added in: v0.7.10
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

function run (command, options) {
  if (~PLATFORM.search('win')) return spawn('cmd', [ '/s', '/c', command ], options)
  if (~PLATFORM.search('nux') || ~PLATFORM.search('darwin')) return spawn('sh', [ '-c', command ], options)
  throw new Error('[Command][run] unrecognized PLATFORM:' + PLATFORM)
}

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
