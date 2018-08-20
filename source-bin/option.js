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
  'eval|e|0-',
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
  'fetch|f|1',
  'server-serve-static|sss',
  'server-serve-static-simple|ssss',
  'server-websocket-group|swg',
  'server-test-connection|stc',
  'server-cache-http-proxy|schp|1-2',
  'timed-lookup-file-generate|tlfg|0-4', // TODO: DEPRECATED: just use mode eval
  'timed-lookup-check-code-generate|tlccg|0-1', // TODO: DEPRECATED: just use mode eval
  'timed-lookup-check-code-verify|tlccv|1-2' // TODO: DEPRECATED: just use mode eval
].map(parseFormat)

const OPTION_CONFIG = {
  prefixENV: 'dr-js',
  prefixJSON: 'dr-js',
  formatList: [
    Config,
    { ...BooleanFlag, name: 'version', shortName: 'v' },
    { ...BooleanFlag, name: 'help', shortName: 'h', description: `show full help, or human readable output` },
    { ...BooleanFlag, name: 'quiet', shortName: 'q', description: `reduce log` },
    ...MODE_FORMAT_LIST,
    parseFormat('hostname|H|1'),
    parseFormat('port|P|1'),
    parseFormat('root|R|1|P'),
    parseFormat('input-file|I|1|P'),
    parseFormat('output-file|O|1|P')
  ]
}

const { parseOption, formatUsage } = prepareOption(OPTION_CONFIG)

export { MODE_FORMAT_LIST, parseOption, formatUsage }
