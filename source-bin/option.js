import { createOptionParser } from 'dr-js/module/common/module/Option/parser'
import { ConfigPreset } from 'dr-js/module/common/module/Option/preset'
import { parseOptionMap, createOptionGetter } from 'dr-js/module/node/module/Option'

const { SingleString, BooleanFlag, Config } = ConfigPreset

const MODE_FORMAT_LIST = [
  [ 'echo', [], '0-' ],
  [ 'cat', [], '0-', true ],
  [ 'write', [], 1, true ],
  [ 'append', [], 1, true ],
  [ 'open', [ 'o' ], '0-1' ],
  [ 'status', [ 's' ], 0 ],
  [ 'file-list', [ 'ls' ], '0-1', true ],
  [ 'file-list-all', [ 'ls-R' ], '0-1', true ],
  [ 'file-create-directory', [ 'mkdir' ], '0-', true ],
  [ 'file-modify-copy', [ 'cp' ], 2, true ],
  [ 'file-modify-move', [ 'mv' ], 2, true ],
  [ 'file-modify-delete', [ 'rm' ], '0-', true ],
  [ 'file-merge', [ 'merge' ], '2-', true ],
  [ 'fetch', [ 'f' ], 1 ],
  [ 'server-serve-static', [ 'sss' ], 0 ],
  [ 'server-serve-static-simple', [ 'ssss' ], 0 ],
  [ 'server-websocket-group', [ 'swg' ], 0 ],
  [ 'server-test-connection', [ 'stc' ], 0 ]
].map(([ name, aliasNameList, argumentCount, isPath = false ]) => ({ optional: true, name, aliasNameList, argumentCount, isPath }))

const OPTION_CONFIG = {
  prefixENV: 'dr-js',
  prefixJSON: 'dr-js',
  formatList: [
    Config,
    { ...BooleanFlag, name: 'version', shortName: 'v' },
    { ...BooleanFlag, name: 'help', shortName: 'h', description: `show help, or request better human readable output` },
    { ...BooleanFlag, name: 'quiet', shortName: 'q', description: `reduce most output` },
    ...MODE_FORMAT_LIST,
    { ...SingleString, optional: true, name: 'hostname', shortName: 'H', description: `for server` },
    { ...SingleString, optional: true, name: 'port', shortName: 'P', description: `for server` },
    { ...SingleString, isPath: true, optional: true, name: 'root', shortName: 'R', description: `for server static` },
    { ...SingleString, isPath: true, optional: true, name: 'output-file', shortName: 'O', description: `for fetch` }
  ]
}

const { parseCLI, parseENV, parseJSON, processOptionMap, formatUsage } = createOptionParser(OPTION_CONFIG)

const parseOption = async () => createOptionGetter(await parseOptionMap({ parseCLI, parseENV, parseJSON, processOptionMap }))

export { MODE_FORMAT_LIST, parseOption, formatUsage }
