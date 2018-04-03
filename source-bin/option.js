import { createOptionParser } from 'dr-js/module/common/module/Option/parser'
import { ConfigPreset } from 'dr-js/module/common/module/Option/preset'
import { parseOptionMap, createOptionGetter } from 'dr-js/module/node/module/Option'

const { OneOfString, BooleanFlag, Any, Config } = ConfigPreset

const MODE_OPTION = [
  'echo', 'cat',
  'write', 'append',
  'open', 'o',
  'file-list', 'ls',
  'file-list-all', 'ls-R',
  'file-create-directory', 'mkdir',
  'file-modify-copy', 'cp',
  'file-modify-move', 'mv',
  'file-modify-delete', 'rm',
  'file-merge', 'merge',
  'server-test-connection', 'stc',
  'server-serve-static', 'sss',
  'server-serve-static-simple', 'ssss',
  'server-websocket-group', 'swg'
]

const OPTION_CONFIG = {
  prefixENV: 'dr-js',
  prefixJSON: 'dr-js',
  formatList: [
    Config,
    { ...BooleanFlag, name: 'help', shortName: 'h' },
    { ...BooleanFlag, name: 'version', shortName: 'v' },
    {
      ...OneOfString(MODE_OPTION),
      optional: true,
      name: 'mode',
      shortName: 'm',
      extendFormatList: [
        { ...Any, name: 'argument', shortName: 'a', description: `different for each mode` },
        { ...BooleanFlag, name: 'quiet', shortName: 'q' }
      ]
    }
  ]
}

const { parseCLI, parseENV, parseJSON, processOptionMap, formatUsage } = createOptionParser(OPTION_CONFIG)

const parseOption = async () => createOptionGetter(await parseOptionMap({ parseCLI, parseENV, parseJSON, processOptionMap }))

export { parseOption, formatUsage }
