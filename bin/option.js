import { stringIndentLine } from 'dr-js/module/common/format'
import { arraySplitChunk } from 'dr-js/module/common/data/__utils__'
import { createOptionParser, OPTION_CONFIG_PRESET } from 'dr-js/module/common/module/OptionParser'
import { parseOptionMap, createOptionGetter } from 'dr-js/module/node/module/ParseOption'

const { SingleString, OneOfString } = OPTION_CONFIG_PRESET

const MODE_OPTION = [
  'env-info', 'i',
  'open', 'o',
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
  formatList: [ {
    ...SingleString,
    optional: true,
    name: 'config',
    shortName: 'c',
    description: `# from JSON: set to 'path/to/config.json'\n# from ENV: set to 'env'`
  }, {
    ...OneOfString(MODE_OPTION),
    name: 'mode',
    shortName: 'm',
    description: `one of:\n${stringIndentLine(arraySplitChunk(MODE_OPTION, 2).map((v) => v.join(' ')).join('\n'), '  ')}`
  }, {
    optional: true,
    name: 'argument',
    shortName: 'a',
    description: `different for each mode`,
    argumentCount: '0+'
  } ]
}

const { parseCLI, parseENV, parseJSON, processOptionMap, formatUsage } = createOptionParser(OPTION_CONFIG)

const parseOption = async () => createOptionGetter(await parseOptionMap({ parseCLI, parseENV, parseJSON, processOptionMap }))

const exitWithError = (error) => {
  __DEV__ && console.warn(error)
  !__DEV__ && console.warn(formatUsage(error.message || error.toString()))
  process.exit(1)
}

export { parseOption, exitWithError }
