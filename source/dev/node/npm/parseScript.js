import { indentLine } from 'source/common/string.js'

const COMPLEX_BASH_COMMAND_SET = new Set([ // common known complex command, will interfere with later parsing `&&`, do not parse further
  'bash', 'sh', '.', 'source',
  'exec', 'eval',
  'su', 'sudo',
  'if',
  'cd', // TODO: try parse simple cd, to unwrap further
  'export',
  'ssh'
])

const SIMPLE_BASH_COMMAND_SET = new Set([ // common known simple command, should just direct run
  'node', 'npx', 'git',
  'rm', 'mkdir',
  'echo', 'cat',
  'exit', 'kill'
])

const REGEXP_INLINE_ENV = /^(?:env )?\w+=\S+ \S/

const REGEXP_ESCAPE = /\\/g
const REGEXP_QUOTE = /[" ]/g
const wrapJoinBashArgs = (args) => args.map((arg) => `"${arg.replace(REGEXP_ESCAPE, '\\\\').replace(REGEXP_QUOTE, '\\$&')}"`).join(' ')

const warpBashSubShell = (command) => `(
${indentLine(command, '  ')}
)`

const parseCommand = (
  packageJSON,
  scriptString,
  level,
  tabLog = (level, ...args) => {}
) => {
  tabLog(level, '[parseCommand]', `input: <${scriptString}>`)
  scriptString = scriptString.trim()

  const [ scriptLeadingCommand, scriptSecondCommand, ...scriptExtraCommandList ] = scriptString.split(' ')

  if (
    COMPLEX_BASH_COMMAND_SET.has(scriptLeadingCommand) ||
    scriptLeadingCommand.startsWith('./')
  ) {
    tabLog(level, '- directly executable complex command, return')
    return scriptString
  } else tabLog(level, `? not directly executable complex command: ${scriptLeadingCommand}`)

  if (scriptString.includes(' && ')) {
    tabLog(level, '- combo command, split')

    const subCommandList = scriptString.split(' && ')
    return warpBashSubShell(subCommandList.map((command) => parseCommand(packageJSON, command, level + 1, tabLog) || command).join('\n'))
  } else tabLog(level, '? not combo command, I guess')

  if (SIMPLE_BASH_COMMAND_SET.has(scriptLeadingCommand)) {
    tabLog(level, '- directly executable simple command, return')

    return scriptString
  } else tabLog(level, `? not directly executable simple command: ${scriptLeadingCommand}`)

  if (REGEXP_INLINE_ENV.test(scriptString)) {
    tabLog(level, '- env prefixing command, return')

    return scriptString
  } else tabLog(level, '? not env prefixing command, I guess')

  // TODO: consider allow package dependency command
  // TODO: consider allow package dependency command
  // TODO: consider allow package dependency command

  if (
    scriptSecondCommand === 'run' &&
    [ 'npm', 'yarn' ].includes(scriptLeadingCommand)
  ) {
    tabLog(level, '- package script, parse')

    const [ scriptName, ...extraArgs ] = scriptExtraCommandList
    extraArgs[ 0 ] === '--' && extraArgs.shift() // concat argument
    return parsePackageScript(packageJSON, scriptName, extraArgs.join(' '), level + 1, tabLog)
  } else tabLog(level, '? unknown npm/yarn script')

  tabLog(level, '? unknown script, bail')
  return ''
}

const parsePackageScript = (
  packageJSON,
  scriptName,
  extraArgsString = '',
  level,
  tabLog = (level, ...args) => {}
) => {
  tabLog(level, '[parsePackageScript]', `script name: <${scriptName}>, extra: ${extraArgsString}`)

  const scriptString = packageJSON[ 'scripts' ][ scriptName ]
  if (!scriptString) throw new Error(`[parsePackageScript] missing script with name: ${scriptName}`)

  const resultCommand = parseCommand(packageJSON, [ scriptString, extraArgsString ].filter(Boolean).join(' '), level + 1, tabLog)
  if (resultCommand) return resultCommand

  tabLog(level, '? un-parsed script, bail to npm run')
  return [ `npm run "${scriptName}"`, extraArgsString ].filter(Boolean).join(' -- ')
}

export {
  wrapJoinBashArgs,
  warpBashSubShell,
  parseCommand,
  parsePackageScript
}
