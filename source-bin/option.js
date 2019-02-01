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
  'eval|e|0-', // -O=outputFile // -I/$1=scriptFile/scriptString // $@: evalArgv
  'eval-readline|erl|0-', // -R=readlineFile // ...eval
  'repl|i', // start node REPL
  'echo||0-', // log $@
  'cat||0-|P', // for 0 args: pipe stdin to stdout, else read $@ as file and pipe to stdout
  'write||1|P', // for use like '>': `dr-js --cat source-file | dr-js --write output-file`
  'append||1|P', // for use like '>>': `dr-js --cat source-file | dr-js --append output-file`
  'open|o|0-1', // use system default app to open uri or path
  'status|s', // -h=isHumanReadableOutput // basic system status
  'file-list|ls|0-1|P',
  'file-list-all|ls-R|0-1|P',
  'file-tree|tree|0-1|P',
  'file-create-directory|mkdir|0-|P',
  'file-modify-copy|cp|2|P',
  'file-modify-move|mv|2|P',
  'file-modify-delete|rm|0-|P',
  'file-merge|merge|2-|P', // $@: merged-file, input-file, input-file, ...
  'fetch|f|1-3', // $@: initialUrl, jumpMax = 4, timeout = 0
  'process-status|ps|0-1', // -h=isHumanReadableOutput // $@: outputMode = 'pid--'
  'server-serve-static|sss|0-1', // -H=hostname:port // -R=staticRoot = cwd // $@: expireTime = 5 * 60 * 1000
  'server-serve-static-simple|ssss|0-1', // -H=hostname:port // -R=staticRoot = cwd // $@: expireTime = 5 * 60 * 1000
  'server-websocket-group|swg', // -H=hostname:port
  'server-test-connection|stc', // -H=hostname:port
  'server-tcp-proxy|stp|1-' // -H=hostname:port // $@: toHostname:toPort, toHostname:toPort, ...
].map(parseFormat)

const OPTION_CONFIG = {
  prefixENV: 'dr-js',
  prefixCONFIG: 'dr-js',
  formatList: [
    Config,
    { ...BooleanFlag, name: 'help', shortName: 'h', description: `show full help, or human readable output` },
    { ...BooleanFlag, name: 'quiet', shortName: 'q', description: `less log` },
    { ...BooleanFlag, name: 'version', shortName: 'v' },
    ...MODE_FORMAT_LIST,
    ...[
      'host|H|1', // hostname:port, can omit both
      'root|R|1|P',
      'input-file|I|1|P',
      'output-file|O|1|P'
    ].map(parseFormat)
  ]
}

const { parseOption, formatUsage } = prepareOption(OPTION_CONFIG)

export { MODE_FORMAT_LIST, parseOption, formatUsage }
