import { ConfigPresetNode, prepareOption } from 'dr-js/module/node/module/Option'

const { SingleString, SinglePath, BooleanFlag, Config } = ConfigPresetNode

const MODE_FORMAT_LIST = [
  [ 'eval', [ 'e' ], '0-1' ],
  [ 'repl', [ 'i' ] ],
  [ 'echo', [], '0-' ],
  [ 'cat', [], '0-', true ],
  [ 'write', [], 1, true ],
  [ 'append', [], 1, true ],
  [ 'open', [ 'o' ], '0-1' ],
  [ 'status', [ 's' ] ],
  [ 'file-list', [ 'ls' ], '0-1', true ],
  [ 'file-list-all', [ 'ls-R' ], '0-1', true ],
  [ 'file-create-directory', [ 'mkdir' ], '0-', true ],
  [ 'file-modify-copy', [ 'cp' ], 2, true ],
  [ 'file-modify-move', [ 'mv' ], 2, true ],
  [ 'file-modify-delete', [ 'rm' ], '0-', true ],
  [ 'file-merge', [ 'merge' ], '2-', true ],
  [ 'fetch', [ 'f' ], 1 ],
  [ 'server-serve-static', [ 'sss' ] ],
  [ 'server-serve-static-simple', [ 'ssss' ] ],
  [ 'server-websocket-group', [ 'swg' ] ],
  [ 'server-test-connection', [ 'stc' ] ],
  [ 'server-cache-http-proxy', [ 'schp' ], '1-2' ],
  [ 'timed-lookup-file-generate', [ 'tlfg' ], '0-4' ], // TODO: DEPRECATED: just use mode eval
  [ 'timed-lookup-check-code-generate', [ 'tlccg' ], '0-1' ], // TODO: DEPRECATED: just use mode eval
  [ 'timed-lookup-check-code-verify', [ 'tlccv' ], '1-2' ] // TODO: DEPRECATED: just use mode eval
].map(([ name, aliasNameList, argumentCount = 0, isPath = false ]) => ({
  optional: true, name, aliasNameList, argumentCount, isPath
}))

const OPTION_CONFIG = {
  prefixENV: 'dr-js',
  prefixJSON: 'dr-js',
  formatList: [
    Config,
    { ...BooleanFlag, name: 'version', shortName: 'v' },
    { ...BooleanFlag, name: 'help', shortName: 'h', description: `show help, or request better human readable output` },
    { ...BooleanFlag, name: 'quiet', shortName: 'q', description: `reduce most output` },
    ...MODE_FORMAT_LIST,
    { ...SingleString, optional: true, name: 'hostname', shortName: 'H', description: `for 'server'` },
    { ...SingleString, optional: true, name: 'port', shortName: 'P', description: `for 'server'` },
    { ...SinglePath, optional: true, name: 'root', shortName: 'R', description: `for 'server-serve-static'` },
    { ...SinglePath, optional: true, name: 'input-file', shortName: 'I', description: `for 'timed-lookup-check-code-generate', 'timed-lookup-check-code-verify'` },
    { ...SinglePath, optional: true, name: 'output-file', shortName: 'O', description: `for 'fetch', 'timed-lookup-file-generate'` }
  ]
}

const { parseOption, formatUsage } = prepareOption(OPTION_CONFIG)

export { MODE_FORMAT_LIST, parseOption, formatUsage }
