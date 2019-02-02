import { ConfigPresetNode, prepareOption, parseCompactFormat } from 'dr-js/module/node/module/Option'

const MODE_FORMAT_LIST = [
  'eval,e|0-|O|eval file or string: -O=outputFile, -I/$1=scriptFile/scriptString, $@=evalArgv',
  'eval-readline,erl|0-|O|eval with readline: -R=readlineFile, ...eval',
  'repl,i||B|start node REPL',
  'echo|0-|O|show args: $@=args',
  'cat|0-|OP|with 0 args pipe stdin to stdout, else read $@ as file and pipe to stdout',
  'write|1|OP|for use like ">": `dr-js --cat source-file | dr-js --write output-file`',
  'append|1|OP|for use like ">>": `dr-js --cat source-file | dr-js --append output-file`',
  'open,o|0-1|O|use system default app to open uri or path: $1=irl-or-path/cwd',
  'status,s||B|basic system status: -h=isHumanReadableOutput',
  'file-list,ls|0-1|OP|list file: $1=path/cwd',
  'file-list-all,ls-R,lla|0-1|OP|list all file: $1=path/cwd',
  'file-tree,tree|0-1|OP|list all file in tree: $1=path/cwd',
  'file-create-directory,mkdir|0-|OP|create directory: $@=pathList',
  'file-modify-copy,cp|2|OP|copy path: $1=pathFrom, $2=pathTo',
  'file-modify-move,mv|2|OP|move path: $1=pathFrom, $2=pathTo',
  'file-modify-delete,rm|0-|OP|delete path: $@=pathList',
  'file-merge,merge|2-|OP|merge to one file: $@=merged-file,input-file,input-file,...',
  'fetch,f|1-3|O|fetch uri: -O=outputFile/stdout, $@=initialUrl,jumpMax/4,timeout/0',
  'process-status,ps|0-1|O|show system process status: -h=isHumanReadableOutput, $1=outputMode/pid--',
  'server-serve-static,sss|0-1|O|static file server: -H=hostname:port, -R=staticRoot/cwd, $@=expireTime/5*60*1000',
  'server-serve-static-simple,ssss|0-1|O|static file server, no HTML: -H=hostname:port, -R=staticRoot/cwd, $@=expireTime/5*60*1000',
  'server-websocket-group,swg||O|websocket chat server: -H=hostname:port',
  'server-test-connection,stc||O|connection test server: -H=hostname:port',
  'server-tcp-proxy,stp|1-|O|tcp proxy server: -H=hostname:port, $@=toHostname:toPort,toHostname:toPort,...'
].map(parseCompactFormat)

const OPTION_CONFIG = {
  prefixENV: 'dr-js',
  prefixCONFIG: 'dr-js',
  formatList: [
    ConfigPresetNode.Config,
    ...[
      'help,h||B|show full help, or human readable output',
      'quiet,q||B|less log',
      'version,v||B|show version',
      'host,H|1|O|common option: $1=hostname:port/localhost:unused-port',
      'root,R|1|OP|common option',
      'input-file,I|1|OP|common option',
      'output-file,O|1|OP|common option'
    ].map(parseCompactFormat),
    ...MODE_FORMAT_LIST
  ]
}

const { parseOption, formatUsage } = prepareOption(OPTION_CONFIG)

export { MODE_FORMAT_LIST, parseOption, formatUsage }
