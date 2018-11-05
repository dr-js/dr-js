import { ConfigPresetNode, prepareOption } from 'dr-js/module/node/module/Option'

const { BooleanFlag, Config } = ConfigPresetNode

const parseFormat = (modeFormat) => {
  const [ name, alterName = '', argumentCount, isPath ] = modeFormat.split('|').map((v) => v || undefined)
  return {
    optional: true,
    name,
    shortName: alterName.length === 1 ? alterName : undefined,
    aliasNameList: alterName ? [ alterName ] : [],
    argumentCount: argumentCount || 0,
    isPath: Boolean(isPath)
  }
}

const MODE_FORMAT_LIST = [
  'eval|e|0-', // ...argumentList // -O=outputFile // -I/$1=scriptFile/scriptString // $@: evalArgv
  'eval-readline|erl|0-', // ...argumentList // -R=largeReadFile
  'repl|i',
  'echo||0-',
  'cat||0-|P',
  'write||1|P',
  'append||1|P',
  'open|o|0-1',
  'status|s',
  'file-list|ls|0-1|P',
  'file-list-all|ls-R|0-1|P',
  'file-create-directory|mkdir|0-|P',
  'file-modify-copy|cp|2|P',
  'file-modify-move|mv|2|P',
  'file-modify-delete|rm|0-|P',
  'file-merge|merge|2-|P',
  'fetch|f|1-3', // initialUrl, jumpMax = 4, timeout = 0
  'server-serve-static|sss|0-1', // expireTime = 5 * 60 * 1000
  'server-serve-static-simple|ssss|0-1', // expireTime = 5 * 60 * 1000
  'server-websocket-group|swg',
  'server-test-connection|stc',
  'server-cache-http-proxy|schp|1-2' // remoteUrlPrefix, expireTimeSec = 7 * 24 * 60 * 60
].map(parseFormat)

const OPTION_CONFIG = {
  prefixENV: 'dr-js',
  prefixJSON: 'dr-js',
  formatList: [
    Config,
    { ...BooleanFlag, name: 'help', shortName: 'h', description: `show full help, or human readable output` },
    { ...BooleanFlag, name: 'quiet', shortName: 'q', description: `less log` },
    { ...BooleanFlag, name: 'version', shortName: 'v' },
    ...MODE_FORMAT_LIST,
    ...[
      'hostname|H|1',
      'port|P|1',
      'root|R|1|P',
      'input-file|I|1|P',
      'output-file|O|1|P'
    ].map(parseFormat)
  ]
}

const { parseOption, formatUsage } = prepareOption(OPTION_CONFIG)

export { MODE_FORMAT_LIST, parseOption, formatUsage }
