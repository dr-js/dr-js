import { Preset, prepareOption } from 'dr-js/module/node/module/Option/preset'

const parseList = (...args) => args.map((compactFormat) => ({
  ...Preset.parseCompact(compactFormat),
  optional: true // set all optional
}))

const COMMON_FORMAT_LIST = parseList(
  'help,h/T|show full help, or human readable output',
  'quiet,q/T|less log',
  'version,v/T|show version',
  'host,H/SS|common option: $1=hostname:port/localhost:unusedPort',
  'root,R/SP|common option',
  'input-file,I/SP|common option',
  'output-file,O/SP|common option'
)

const MODE_FORMAT_LIST = parseList(
  'eval,e/A|eval file or string: -O=outputFile, -I/$0=scriptFile/scriptString, $@=...evalArgv',
  'eval-readline,erl/A|eval with readline: -R=readlineFile, ...eval',
  'repl,i/T|start node REPL',
  'echo/A|show args: $@=...args',
  'cat/AP/0-|with 0 args pipe stdin to stdout, else read $@ as file and pipe to stdout',
  'write/SP|for use like ">": `dr-js --cat sourceFile | dr-js --write outputFile`',
  'append/SP|for use like ">>": `dr-js --cat sourceFile | dr-js --append outputFile`',
  'open,o//0-1|use system default app to open uri or path: $0=uriOrPath/cwd',
  'status,s/T|basic system status: -h=isHumanReadableOutput',
  'file-list,ls/AP/0-1|list file: $0=path/cwd',
  'file-list-all,ls-R,lla/AP/0-1|list all file: $0=path/cwd',
  'file-tree,tree/AP/0-1|list all file in tree: $0=path/cwd',
  'file-create-directory,mkdir/AP/0-|create directory: $@=...pathList',
  'file-modify-copy,cp/AP/2|copy path: $@=pathFrom,pathTo',
  'file-modify-move,mv/AP/2|move path: $@=pathFrom,pathTo',
  'file-modify-delete,rm/AP/0-|delete path: $@=...pathList',
  'file-merge,merge/AP/2-|merge to one file: $@=mergedFile,...inputFileList',
  'fetch,f//1-3|fetch uri: -O=outputFile/stdout, $@=initialUrl,jumpMax/4,timeout/0',
  'process-status,ps//0-1|show system process status: -h=isHumanReadableOutput, $0=outputMode/"pid--"',
  'server-serve-static,sss//0-1|static file server: -H=hostname:port, -R=staticRoot/cwd, $0=expireTime/5*60*1000',
  'server-serve-static-simple,ssss//0-1|static file server, no HTML: -H=hostname:port, -R=staticRoot/cwd, $0=expireTime/5*60*1000',
  'server-websocket-group,swg|websocket chat server: -H=hostname:port',
  'server-test-connection,stc|connection test server: -H=hostname:port',
  'server-tcp-proxy,stp//1-|tcp proxy server: -H=hostname:port, $@=toHostname:toPort,toHostname:toPort,...'
)

const OPTION_CONFIG = {
  prefixENV: 'dr-js',
  prefixCONFIG: 'dr-js',
  formatList: [
    Preset.Config,
    ...COMMON_FORMAT_LIST,
    ...MODE_FORMAT_LIST
  ]
}

const { parseOption, formatUsage } = prepareOption(OPTION_CONFIG)

export { MODE_FORMAT_LIST, parseOption, formatUsage }
