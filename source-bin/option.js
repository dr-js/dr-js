import { Preset, prepareOption } from 'source/node/module/Option/preset'

const parseList = (...args) => args.map((compactFormat) => Preset.parseCompact(compactFormat, {
  optional: true // set all optional
}))

const COMMON_FORMAT_LIST = parseList(
  'help,h/T|show full help',
  'version,v/T|show version',
  'note,N/AS|noop, tag for ps/htop',

  'quiet,q/T|less log',
  'input-file,I/SP|common option',
  'output-file,O/SP|common option',
  'pid-file,pid/SP|common option',

  'host,H/SS|common option: $0=hostname:port (hostname default to 0.0.0.0)',
  'route-prefix,RP/SS|common option: $0=routePrefix (default to "", set like "/prefix")',
  'root,R/SP|common option: $0=path/cwd',

  'json,J/T|output JSON, if supported'
)

const MODE_FORMAT_LIST = parseList(
  'eval,e/A|eval file or string: -O=outputFile, -I/$0=scriptFile/scriptString, $@=...evalArgv',
  'repl,i/T|start node REPL',
  'fetch,f//1-4|fetch url: -I=requestBody/null, -O=outputFile/stdout, $@=initialUrl,method/GET,jumpMax/4,timeout/0',

  'wait/AI/0-1|wait specified time, in msec: $0=waitTime/2*1000',
  'echo/A|show args: $@=...args',
  'cat/AP/0-|with 0 args pipe stdin to stdout, else read $@ as file and pipe to stdout',
  'write/SP|for use like ">": `dr-js --cat sourceFile | dr-js --write outputFile`',
  'append/SP|for use like ">>": `dr-js --cat sourceFile | dr-js --append outputFile`',
  'merge/AP/2-|merge to one file: $@=mergedFile,...inputFileList',
  'create-directory,mkdir/AP/0-|create directory: $@=...pathList',
  'modify-copy,cp/AP/2|copy path: $@=pathFrom,pathTo',
  'modify-rename,mv/AP/2|rename path: $@=pathFrom,pathTo',
  'modify-delete,rm/AP/0-|delete path: $@=...pathList',

  'status,s/T|basic system status: -J=isOutputJSON',
  'open,o//0-2|use system default app to open uri or path: $0=uriOrPath/cwd, $1=isDetached/false',
  'which,w//1|resolve to full executable path: -R=resolveRoot/cwd, $0=commandNameOrPath',
  'detach,bg/A|run command detached: -O=logFile/ignore, $0=...argsList',
  'process-status,ps//0-1|show system process status: -J=isOutputJSON, $0=outputMode/"pid--"',
  'process-signal,sig//0-2|send signal to process by pid: -I=pidFile $@=pid/pidFile,signal/"SIGTERM"',

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
