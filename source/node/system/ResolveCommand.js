import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { runStdout } from 'source/node/run.js'

const configureLinux = () => [
  'which', // do not search cwd // https://ss64.com/bash/which.html
  (stdoutString) => stdoutString.trim()
]
const configureWin32 = (extList = (process.env.PATHEXT || '.EXE;.BAT;.CMD').toUpperCase().split(';')) => [ // process.env.PATHEXT // '.COM;.EXE;.BAT;.CMD;.VBS;.VBE;.JS;.JSE;.WSF;.WSH;.MSC'
  'where.exe', // search cwd // https://ss64.com/nt/where.html
  (stdoutString) => stdoutString.split('\r\n').find((path) => extList.includes(path.slice(path.lastIndexOf('.')).toUpperCase())) || ''
]

const CONFIGURE_MAP = {
  linux: configureLinux,
  win32: configureWin32,
  darwin: configureLinux,
  android: configureLinux
}

let cacheConfigure
const configureCached = () => {
  if (cacheConfigure === undefined) {
    const configure = CONFIGURE_MAP[ process.platform ]
    if (!configure) throw new Error(`unsupported platform: ${process.platform}`)
    cacheConfigure = configure()
  }
  return cacheConfigure
}

// for resolving
const resolveCommandName = (commandName, cwd) => { // if not found, result in empty string: ""
  const [ checkCommand, processFunc ] = configureCached()
  return processFunc(String(spawnSync(checkCommand, [ commandName ], { cwd }).stdout || ''))
}
const resolveCommandNameAsync = async (commandName, cwd) => { // if not found, result in empty string: ""
  const [ checkCommand, processFunc ] = configureCached()
  return processFunc(String(await runStdout([ checkCommand, commandName ], { cwd }).catch(() => '')))
}

// try resolve command, fast resolve if command itself contain path sep
const resolveCommand = (command, cwd) => REGEXP_PATH_SEP.test(command) ? resolve(cwd || '', command) : resolveCommandName(command, cwd)
const resolveCommandAsync = async (command, cwd) => REGEXP_PATH_SEP.test(command) ? resolve(cwd || '', command) : resolveCommandNameAsync(command, cwd)
const REGEXP_PATH_SEP = /[\\/]/

export {
  resolveCommandName, resolveCommandNameAsync,
  resolveCommand, resolveCommandAsync
}
