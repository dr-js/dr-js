import { Preset, prepareOption } from 'source/node/module/Option/preset.js'

const COMMON_FORMAT_LIST = Preset.parseCompactList(
  'help,h/T|show full help',
  'version,v/T|show version',
  'note,N/O|noop, tag for ps/htop',

  'quiet,q/T|less log',
  'input-file,I/SP,O|common option',
  'output-file,O/SP,O|common option',
  'pid-file,pid/SP,O|common option',

  'host,H/SS,O|common option: $0=hostname:port (hostname default to 0.0.0.0)',
  'route-prefix,RP/SS,O|common option: $0=routePrefix (default to "", set like "/prefix")',
  'root,R/SP,O|common option: $0=path/cwd',
  'timeout,T/SI,O|common option, 0 for unlimited: $0=msec/undefined',

  'json,J/T|output JSON, if supported'
)

const MODE_FORMAT_LIST = Preset.parseCompactList(
  'eval,e/A|eval file or string: -O=outputFile, -I/$0=scriptFile/scriptString, $@=...evalArgv',
  'repl,i/T|start node REPL',
  'fetch,f/O/1-4|fetch url with http_proxy env support: -I=requestBody/null, -O=outputFile/stdout, -T=timeout/0, $@=initialUrl,method/GET,jumpMax/4',

  'wait/AI,O/0-1|wait specified time, in msec: $0=waitTime/2*1000',
  'echo/A|show args: $@=...args',
  'cat/AP,O/0-|with 0 args pipe stdin to stdout, else read $@ as file and pipe to stdout',
  'write/SP,O|for use like ">": `dr-js --cat sourceFile | dr-js --write outputFile`',
  'append/SP,O|for use like ">>": `dr-js --cat sourceFile | dr-js --append outputFile`',
  'merge/AP,O/2-|merge to one file: $@=mergedFile,...inputFileList',
  'create-directory,mkdir/AP,O/0-|create directory: $@=...pathList',
  'modify-copy,cp/AP,O/2|copy path: $@=pathFrom,pathTo',
  'modify-rename,mv/AP,O/2|rename path: $@=pathFrom,pathTo',
  'modify-delete,rm/AP,O/0-|delete path: $@=...pathList',

  'status,s/T|basic system status: -J=isOutputJSON',
  'open,o/O/0-2|use system default app to open uri or path: $0=uriOrPath/cwd, $1=isDetached/false',
  'which,w/O/1|resolve to full executable path: -R=resolveRoot/cwd, $0=commandNameOrPath',
  'run/A|run command: $0=...argsList', // mostly for test OS exec
  'detach,bg/A|run command detached: -O=logFile/ignore, $0=...argsList',
  'process-status,ps/O/0-1|show system process status: -J=isOutputJSON, $0=outputMode/"pid--"',
  'process-signal,sig/O/0-2|send signal to process by pid: -I=pidFile $@=pid/pidFile,signal/"SIGTERM"',

  'json-format,jf/AI,O/0-1|re-format JSON file: -O=outputFile/-I, -I=inputFile, $0=unfoldLevel/2',

  'server-serve-static,sss/O/0-1|static file server: -H=hostname:port, -R=staticRoot/cwd, $0=expireTime/5*1000',
  'server-serve-static-simple,ssss/O/0-1|static file server, no HTML: -H=hostname:port, -R=staticRoot/cwd, $0=expireTime/5*1000',
  'server-websocket-group,swg/O|websocket chat server: -H=hostname:port',
  'server-test-connection,stc/O|connection test server: -H=hostname:port',
  'server-tcp-proxy,stp/O/1-|tcp proxy server: -H=hostname:port, $@=toHostname:toPort,toHostname:toPort,...'
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
