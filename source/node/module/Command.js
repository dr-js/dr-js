import nodeModuleOs from 'os'
import nodeModuleChildProcess from 'child_process'

const PLATFORM = nodeModuleOs.platform()

function run (command, options) {
  if (~PLATFORM.search('win')) return spawn('cmd', [ '/s', '/c', command ], options)
  if (~PLATFORM.search('nux') || ~PLATFORM.search('darwin')) return spawn('sh', [ '-c', command ], options)
  throw new Error('[Command][run] unrecognized PLATFORM:' + PLATFORM)
}

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

export {
  run,
  spawn
}
