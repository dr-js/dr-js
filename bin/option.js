import { Common, Node } from 'module/Dr.node'

const { createOptionParser, OPTION_CONFIG_PRESET } = Common.Module
const {
  parseOptionMap,
  getOptionOptional, getSingleOptionOptional,
  getOption, getSingleOption
} = Node.Module

const MODE_OPTION = [
  'env-info', 'i',
  'file-list', 'ls',
  'file-list-all', 'ls-R',
  'file-create-directory', 'mkdir',
  'file-modify-copy', 'cp',
  'file-modify-move', 'mv',
  'file-modify-delete', 'rm',
  'server-serve-static', 'sss',
  'server-serve-static-simple', 'ssss',
  'server-websocket-group', 'swg'
]

const OPTION_CONFIG = {
  prefixENV: 'dr-js',
  formatList: [
    {
      ...OPTION_CONFIG_PRESET.SingleString,
      name: 'config',
      shortName: 'c',
      optional: true,
      description: `# from JSON: set to 'path/to/config.json'\n# from ENV: set to 'env'`
    },
    {
      ...OPTION_CONFIG_PRESET.OneOfString(MODE_OPTION),
      name: 'mode',
      shortName: 'm'
    },
    { name: 'argument', shortName: 'a', optional: true, description: `different for each mode`, argumentCount: '0+' }
  ]
}

const { parseCLI, parseENV, parseJSON, processOptionMap, formatUsage } = createOptionParser(OPTION_CONFIG)

const parseOption = async () => ({
  optionMap: await parseOptionMap({ parseCLI, parseENV, parseJSON, processOptionMap }),
  getOption,
  getOptionOptional,
  getSingleOption,
  getSingleOptionOptional
})

const exitWithError = (error) => {
  __DEV__ && console.warn(error)
  !__DEV__ && console.warn(formatUsage(error.message || error.toString()))
  process.exit(1)
}

export { parseOption, exitWithError }
