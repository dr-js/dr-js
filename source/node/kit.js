import { resolve } from 'path'
import { homedir, tmpdir } from 'os'

import { clock } from 'source/common/time.js'
import { time } from 'source/common/format.js'
import { clamp } from 'source/common/math/base.js'

import { findUpPackageRoot, getSudoArgs } from 'source/node/module/Software/npm.js'
import { configureTerminalColor } from 'source/node/module/TerminalColor.js'
import { resolveCommand } from './system/ResolveCommand.js'
import { runDetached, runSync } from './run.js'

const loadEnvKey = (key) => {
  try {
    return JSON.parse(process.env[ key ])
  } catch (error) { return null }
}
const saveEnvKey = (key, value) => {
  try {
    process.env[ key ] = JSON.stringify(value)
  } catch (error) {}
}
const syncEnvKey = (key, defaultValue) => {
  const value = loadEnvKey(key) || defaultValue
  saveEnvKey(key, value)
  return value
}

const argvFlag = (...checkFlagList) => process.argv.find((flag) => checkFlagList.includes(flag))

const ENV_KEY_LOGGER = '__DRJS_KIT_LOGGER__'
const ENV_KEY_VERBOSE = '__DRJS_KIT_VERBOSE__'

const getKitLogger = ({
  title = 'kit',
  isNoEnvKey = false, // to stop change to "process.env"
  isVerbose = Boolean(loadEnvKey(ENV_KEY_VERBOSE) || argvFlag('verbose') || process.env.KIT_VERBOSE),
  isQuiet = Boolean(argvFlag('quiet') || process.env.KIT_QUIET),
  padWidth = clamp(process.env.KIT_LOGGER_WIDTH || (process.stdout.isTTY && process.stdout.columns) || 80, 32, 240),
  TerminalColor = configureTerminalColor(),
  colorPadLogFunc = TerminalColor.fg.yellow,
  colorStepLogFunc = TerminalColor.fg.yellow,
  colorLogFunc = TerminalColor.fg.darkGray,
  logFunc = console.log
} = {}) => {
  const startTime = clock()

  !isNoEnvKey && saveEnvKey(ENV_KEY_VERBOSE, Boolean(isVerbose))

  const envKit = loadEnvKey(ENV_KEY_LOGGER) || { titleList: [], startTime, pid: null }
  !isNoEnvKey && envKit.pid !== process.pid && saveEnvKey(ENV_KEY_LOGGER, { ...envKit, titleList: [ title, ...envKit.titleList ], pid: process.pid })
  title = [ title, ...envKit.titleList.map((v) => v.slice(0, clamp(Math.floor(padWidth / 20), 3, 9))) ].join('|')

  let prevTime = clock()
  const getPadTime = () => {
    const currentTime = clock()
    prevTime = currentTime
    return envKit.startTime === startTime
      ? time(currentTime - startTime)
      : `${time(currentTime - startTime)}/${time(currentTime - envKit.startTime)}`
  }
  const getStepTime = () => {
    const currentTime = clock()
    const stepTime = currentTime - prevTime
    prevTime = currentTime
    return time(stepTime)
  }

  const padLog = (...args) => {
    const start = `## ${args.join(' ')} `
    const end = ` [${title}|${getPadTime()}]`
    logFunc(`\n${start.padEnd(padWidth - end.length, '-')}${colorPadLogFunc(end)}`)
  }
  const stepLog = (...args) => logFunc(`- ${colorStepLogFunc(`(+${getStepTime()})`)} ${args.join(' ')}`)
  const log = (...args) => logFunc(colorLogFunc(`- ${args.join(' ')}`))
  const devLog = isVerbose ? log : () => {}

  return (!isVerbose && isQuiet)
    ? { padLog: stepLog, stepLog: devLog, log: devLog, devLog: () => {} }
    : { padLog, stepLog, log, devLog }
}

const getKitPathCombo = ({
  PATH_ROOT = findUpPackageRoot(process.cwd()),
  PATH_OUTPUT = 'output-gitignore/', // relative
  PATH_TEMP = '.temp-gitignore/', // relative
  PATH_HOME = homedir(),
  PATH_OSTEMP = tmpdir()
} = {}) => {
  // allow use relative path from PATH_ROOT
  PATH_OUTPUT = resolve(PATH_ROOT, PATH_OUTPUT)
  PATH_TEMP = resolve(PATH_ROOT, PATH_TEMP)
  PATH_HOME = resolve(PATH_ROOT, PATH_HOME)
  PATH_OSTEMP = resolve(PATH_ROOT, PATH_OSTEMP)
  return {
    PATH_ROOT, fromRoot: (...args) => resolve(PATH_ROOT, ...args),
    PATH_OUTPUT, fromOutput: (...args) => resolve(PATH_OUTPUT, ...args),
    PATH_TEMP, fromTemp: (...args) => resolve(PATH_TEMP, ...args),
    PATH_HOME, fromHome: (...args) => resolve(PATH_HOME, ...args),
    PATH_OSTEMP, fromOsTemp: (...args) => resolve(PATH_OSTEMP, ...args)
  }
}

const getKitRun = ({
  PATH_ROOT, // required
  log = console.log,
  isQuiet = argvFlag('quiet') || Boolean(process.env.KIT_QUIET),
  isDryRun = Boolean(process.env.KIT_DRY_RUN)
} = {}) => {
  const toArgList = (argListOrString) => Array.isArray(argListOrString) ? [ ...argListOrString ] : argListOrString.split(' ').filter(Boolean) // prepend `'bash', '-c'` to run in bash shell
  const RUN = (argListOrString, { isDetached = false, ...option } = {}) => {
    const argList = toArgList(argListOrString)
    argList[ 0 ] = resolveCommand(argList[ 0 ], PATH_ROOT) // mostly for finding `npm.cmd` on win32
    if (isDryRun) !isQuiet && log(`[${isDryRun ? 'RUN|DRY' : isDetached ? 'RUN|DETACHED' : 'RUN'}] "${argList.join(' ')}"`)
    else return (isDetached ? runDetached : runSync)(argList, { cwd: PATH_ROOT, stdio: isQuiet ? [ 'ignore', 'ignore', 'inherit' ] : 'inherit', ...option })
  }
  const RUN_SUDO_NPM = (argListOrString, option) => RUN([ ...getSudoArgs(), ...toArgList(argListOrString) ], option)
  return { RUN, RUN_SUDO_NPM }
}

const getKit = (option) => {
  const kitLogger = getKitLogger(option)
  const kitPathCombo = getKitPathCombo(option)
  const kitRun = getKitRun({ ...option, ...kitLogger, ...kitPathCombo })
  return { ...kitLogger, ...kitPathCombo, ...kitRun }
}

const runKit = (asyncFunc, {
  title = process.argv.slice(2).join('+') || undefined,
  kit = getKit({ title })
} = {}) => {
  const startTime = clock()
  new Promise((resolve) => resolve(asyncFunc(kit))).then(
    () => { kit.padLog(`done in ${time(clock() - startTime)}`) },
    (error) => {
      console.warn(error) // to check error message & stacktrace
      kit.padLog(`error after ${time(clock() - startTime)}`)
      process.exit(-1)
    }
  )
}

export {
  loadEnvKey, saveEnvKey, syncEnvKey,
  argvFlag,
  ENV_KEY_LOGGER, ENV_KEY_VERBOSE,
  getKitLogger, getKitPathCombo, getKitRun, getKit,
  runKit
}
