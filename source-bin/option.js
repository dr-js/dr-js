import { Preset, prepareOption } from '@dr-js/core/module/node/module/Option/preset'

const parseList = (...args) => args.map((compactFormat) => Preset.parseCompact(compactFormat, {
  optional: true // set all optional
}))

const COMMON_FORMAT_LIST = parseList(
  'help,h/T|show full help',
  'quiet,q/T|less log',
  'version,v/T|show version',
  'json,J/T|output JSON, if supported',
  'host,H/SS|common option: $0=hostname:port (hostname default to 0.0.0.0)',
  'root,R/SP|common option: $0=path/cwd',
  'input-file,I/SP|common option',
  'output-file,O/SP|common option'
)

const MODE_FORMAT_LIST = parseList(
  'eval,e/A|eval file or string: -O=outputFile, -I/$0=scriptFile/scriptString, $@=...evalArgv',
  'repl,i/T|start node REPL',

  'wait/AI/0-1|wait specified time, in msec: $0=waitTime/2*1000',
  'echo/A|show args: $@=...args',
  'cat/AP/0-|with 0 args pipe stdin to stdout, else read $@ as file and pipe to stdout',
  'write/SP|for use like ">": `dr-js --cat sourceFile | dr-js --write outputFile`',
  'append/SP|for use like ">>": `dr-js --cat sourceFile | dr-js --append outputFile`',
  'merge/AP/2-|merge to one file: $@=mergedFile,...inputFileList',
  'create-directory,mkdir/AP/0-|create directory: $@=...pathList',
  'modify-copy,cp/AP/2|copy path: $@=pathFrom,pathTo',
  'modify-move,mv/AP/2|move path: $@=pathFrom,pathTo',
  'modify-delete,rm/AP/0-|delete path: $@=...pathList',

  'status,s/T|basic system status: -J=isOutputJSON',
  'open,o//0-1|use system default app to open uri or path: $0=uriOrPath/cwd',
  'fetch,f//1-3|fetch "GET" uri: -O=outputFile/stdout, $@=initialUrl,jumpMax/4,timeout/0',
  'process-status,ps//0-1|show system process status: -J=isOutputJSON, $0=outputMode/"pid--"',
  'json-format,jf/AI/0-1|re-format JSON file: -O=outputFile/-I, -I=inputFile, $0=unfoldLevel/2',

  'server-serve-static,sss//0-1|static file server: -H=hostname:port, -R=staticRoot/cwd, $0=expireTime/5*1000',
  'server-serve-static-simple,ssss//0-1|static file server, no HTML: -H=hostname:port, -R=staticRoot/cwd, $0=expireTime/5*1000',
  'server-websocket-group,swg|websocket chat server: -H=hostname:port',
  'server-test-connection,stc|connection test server: -H=hostname:port',
  'server-tcp-proxy,stp//1-|tcp proxy server: -H=hostname:port, $@=toHostname:toPort,toHostname:toPort,...'
)
const MODE_NAME_LIST = MODE_FORMAT_LIST.map(({ name }) => name)

const OPTION_CONFIG = {
  prefixENV: 'dr-js',
  // prefixCONFIG: 'dr-js',
  formatList: [
    Preset.Config,
    ...COMMON_FORMAT_LIST,
    ...MODE_FORMAT_LIST
  ]
}

const { parseOption, formatUsage } = prepareOption(OPTION_CONFIG)

export { MODE_NAME_LIST, parseOption, formatUsage }
