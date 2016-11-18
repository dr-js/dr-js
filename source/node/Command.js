import Dr from '../Dr'

import nodeModuleOs from 'os'
import nodeModuleChildProcess from 'child_process'

// const SAMPLE_OPTIONS = {
//   cwd: 'cwd',
//   env: { env: 'env' },
//   stdoutStream: process.stdout,
//   stderrStream: process.stderr,
//   callbackOutput: (eventType, outputType, data) => {},
//   callback: (code, signal) => {},
// }

const PLATFORM = nodeModuleOs.platform()

function run (command, options) {
  if (~PLATFORM.search('win')) return spawn('cmd', [ '/s', '/c', command ], options)
  if (~PLATFORM.search('nux') || ~PLATFORM.search('darwin')) return spawn('sh', [ '-c', command ], options)
  throw new Error('[Command][run] unrecognized PLATFORM:' + PLATFORM)
}

function spawn (command, argList = [], { callback, cwd, env, shell, detached, stdoutStream, stderrStream, callbackOutput }) {
  const childProcess = nodeModuleChildProcess.spawn(command, argList, {
    cwd: cwd || process.cwd(),
    env: env || process.env,
    shell: shell || true,
    detached: detached || false // Added in: v0.7.10
  })
  childProcess.stdout.on('data', (data) => {
    stdoutStream && stdoutStream.write(data)
    callbackOutput && callbackOutput('data', 'stdout', data)
  })
  childProcess.stdout.on('end', () => {
    // stdoutStream && stdoutStream.end() // may close
    callbackOutput && callbackOutput('end', 'stdout')
  })
  childProcess.stderr.on('data', (data) => {
    stderrStream && stderrStream.write(data)
    callbackOutput && callbackOutput('data', 'stderr', data)
  })
  childProcess.stderr.on('end', () => {
    // stderrStream && stderrStream.end()
    callbackOutput && callbackOutput('end', 'stderr')
  })
  childProcess.on('exit', (code, signal) => {
    Dr.debug(10, '[Exit] code:', code, 'signal:', signal)
    callback && callback(code, signal)
  })
  childProcess.on('error', (error) => {
    Dr.debug(10, '[Error] error:', error, error.stack && error.stack)
    callback && callback(-1, error)
  })
  return childProcess
}

export {
  run,
  spawn
}

export default {
  run,
  spawn
}
