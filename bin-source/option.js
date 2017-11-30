import { Common, Node } from '../library/Dr.node'

const { createOptionParser, OPTION_CONFIG_PRESET } = Common.Module
const {
  parseOptionMap,
  getOptionOptional, getSingleOptionOptional,
  getOption, getSingleOption
} = Node.Module

const MODE_OPTION = [
  'env-info',
  'file-list', 'ls',
  'file-modify-copy', 'cp',
  'file-modify-move', 'mv',
  'file-modify-delete', 'rm',
  'server-serve-static', 'sss'
]

const OPTION_CONFIG = {
  prefixENV: 'dr-js',
  formatList: [
    {
      name: 'config',
      shortName: 'c',
      optional: true,
      description: `# from JSON: set to 'path/to/config.json'\n# from ENV: set to 'env'`,
      ...OPTION_CONFIG_PRESET.SingleString
    },
    {
      name: 'mode',
      shortName: 'm',
      description: `should be one of:\n  - ${MODE_OPTION.join('\n  - ')}`,
      ...OPTION_CONFIG_PRESET.OneOfString(MODE_OPTION)
    },
    {
      name: 'argument',
      shortName: 'a',
      optional: true,
      description: `different for each mode`,
      argumentCount: '0+'
    }
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
  console.warn(formatUsage(error.message || error.toString()))
  process.exit(1)
}

export { parseOption, exitWithError }
