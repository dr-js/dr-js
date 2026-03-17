# Specification

* [Bin Option Format](#bin-option-format)

#### Bin Option Format
📄 [source-bin/option.js](source-bin/option.js)
> ```
> CLI Usage:
>   --config --c -c [OPTIONAL] [ARGUMENT=1]
>       from JS/JSON: set to "path/to/config.js|json"
>       from ENV: set to "env" to enable, default not check env
>       from ENV JSON: set to "json-env:ENV_NAME" to read the ENV string as JSON, or "jz64/jb64-env"
>       from CLI JSON: set to "json-cli:JSON_STRING" to read the appended string as JSON, or "jz64/jb64-cli"
>   --help --h -h [OPTIONAL] [ARGUMENT=0-1]
>       show full help
>   --version --v -v [OPTIONAL] [ARGUMENT=0-1]
>       show version
>   --note --N -N [OPTIONAL] [ARGUMENT=1+]
>       noop, tag for ps/htop
>   --quiet --q -q [OPTIONAL] [ARGUMENT=0-1]
>       less log
>   --input-file --I -I [OPTIONAL] [ARGUMENT=1]
>       common option
>   --output-file --O -O [OPTIONAL] [ARGUMENT=1]
>       common option
>   --pid-file --pid [OPTIONAL] [ARGUMENT=1]
>       common option
>   --host --H -H [OPTIONAL] [ARGUMENT=1]
>       common option: $0=hostname:port (hostname default to 0.0.0.0)
>   --route-prefix --RP [OPTIONAL] [ARGUMENT=1]
>       common option: $0=routePrefix (default to "", set like "/prefix")
>   --root --R -R [OPTIONAL] [ARGUMENT=1]
>       common option, may be path to repo folder, or "package.json" file: $0=path/cwd
>   --timeout --T -T [OPTIONAL] [ARGUMENT=1]
>       common option, 0 for unlimited: $0=msec/undefined
>   --git-commit --G -G [OPTIONAL] [ARGUMENT=0-1]
>       common option, mostly for version marking
>   --debug --D -D [OPTIONAL] [ARGUMENT=0-1]
>       more debug log, mute by "quiet"
>   --json --J -J [OPTIONAL] [ARGUMENT=0-1]
>       output JSON, if supported
>   --eval --e -e [OPTIONAL] [ARGUMENT=0+]
>       eval file or string: -O=outputFile, -I/$0=scriptFile/scriptString, $@=...evalArgv
>   --repl --i -i [OPTIONAL] [ARGUMENT=0-1]
>       start node REPL
>   --fetch --f -f [OPTIONAL] [ARGUMENT=1-3]
>       fetch url with http_proxy env support: -I=requestBody/null, -O=outputFile/stdout, -T=timeout/0, $@=initialUrl,method/GET,jumpMax/4
>   --wait [OPTIONAL] [ARGUMENT=0-1]
>       wait specified time, in msec: $0=waitTime/2*1000
>   --echo [OPTIONAL] [ARGUMENT=0+]
>       show args: $@=...args
>   --cat [OPTIONAL] [ARGUMENT=0+]
>       with 0 args pipe stdin to stdout, else read $@ as file and pipe to stdout
>   --write [OPTIONAL] [ARGUMENT=1]
>       for use like ">": `dr-js --cat sourceFile | dr-js --write outputFile`
>   --append [OPTIONAL] [ARGUMENT=1]
>       for use like ">>": `dr-js --cat sourceFile | dr-js --append outputFile`
>   --text-file --txt [OPTIONAL] [ARGUMENT=0-1]
>       ">" or ">>" text to file: -O=outputFile, $N=fileTextContent, $1=openMode/write
>   --text-replace --tr [OPTIONAL] [ARGUMENT=2]
>       replace first string in text file: -I=textFile, $0=fromString, $1=toString
>   --text-replace-all --tra [OPTIONAL] [ARGUMENT=2]
>       replace all string in text file: -I=textFile, $0=fromString, $1=toString
>   --merge [OPTIONAL] [ARGUMENT=2+]
>       merge to one file: $@=mergedFile,...inputFileList
>   --create-directory --mkdir [OPTIONAL] [ARGUMENT=0+]
>       create directory: $@=...pathList
>   --modify-copy --cp [OPTIONAL] [ARGUMENT=2]
>       copy path: $@=pathFrom,pathTo
>   --modify-rename --mv [OPTIONAL] [ARGUMENT=2]
>       rename path: $@=pathFrom,pathTo
>   --modify-delete --rm [OPTIONAL] [ARGUMENT=0+]
>       delete path: $@=...pathList
>   --status --s -s [OPTIONAL] [ARGUMENT=0-1]
>       basic system status: -J=isOutputJSON
>   --open --o -o [OPTIONAL] [ARGUMENT=0-2]
>       use system default app to open uri or path: $0=uriOrPath/cwd, $1=isDetached/false
>   --which --w -w [OPTIONAL] [ARGUMENT=1]
>       resolve to full executable path: -R=resolveRoot/cwd, $0=commandNameOrPath
>   --run [OPTIONAL] [ARGUMENT=0+]
>       run command: $0=...argsList
>   --detach --bg [OPTIONAL] [ARGUMENT=0+]
>       run command detached: -O=logFile/ignore, $0=...argsList
>   --process-status --ps [OPTIONAL] [ARGUMENT=0-1]
>       show system process status: -J=isOutputJSON, $0=outputMode/"pid--"
>   --process-signal --sig [OPTIONAL] [ARGUMENT=0-2]
>       send signal to process by pid: -I=pidFile $@=pid/pidFile,signal/"SIGTERM"
>   --json-format --jf [OPTIONAL] [ARGUMENT=0-1]
>       re-format JSON file: -O=outputFile/-I, -I=inputFile, $0=unfoldLevel/2
>   --encode --enc [OPTIONAL] [ARGUMENT=1]
>       encode text as "b64/gz64/br64": -O=outputFile/stdout, $N=text, $1=codecType
>   --decode --dec [OPTIONAL] [ARGUMENT=1]
>       decode text as "b64/gz64/br64": -O=outputFile/stdout, $N=text, $1=codecType
>   --file-list --ls [OPTIONAL] [ARGUMENT=0-1]
>       list file: $0=path/cwd
>   --file-list-all --ls-R --lla [OPTIONAL] [ARGUMENT=0-1]
>       list all file: $0=path/cwd
>   --file-tree --tree [OPTIONAL] [ARGUMENT=0-1]
>       list all file in tree: $0=path/cwd
>   --compress --a -a [OPTIONAL] [ARGUMENT=0-1]
>       compress to archive: -I=inputDirectory, -O=outputFile
>   --extract --x -x [OPTIONAL] [ARGUMENT=0-1]
>       extract from archive: -I=inputFile, -O=outputPath
>   --docker --dk [OPTIONAL] [ARGUMENT=1+]
>       run "docker" command: $@=...argList
>   --docker-compose --dc [OPTIONAL] [ARGUMENT=1+]
>       run "docker-compose" command: $@=...argList
>   --auth-file-describe [OPTIONAL] [ARGUMENT=0-1]
>       describe auth file: -I=authFile
>   --auth-check-code-generate [OPTIONAL] [ARGUMENT=0-1]
>       generate checkCode from auth file: -I=authFile, $0=timestamp/now
>   --auth-check-code-verify [OPTIONAL] [ARGUMENT=1-2]
>       verify checkCode with auth file: -I=authFile, $@=checkCode,timestamp/now
>   --auth-gen-tag [OPTIONAL] [ARGUMENT=1]
>       generate auth file: -O=outputFile
>     --auth-gen-size [ARGUMENT=1]
>     --auth-gen-token-size [ARGUMENT=1]
>     --auth-gen-time-gap [ARGUMENT=1]
>     --auth-gen-info [ARGUMENT=1]
>   --ping-race [OPTIONAL] [ARGUMENT=1+]
>       tcp-ping list of url to find the fastest: -T=timeout/5000, $@=...urlList
>   --ping-stat [OPTIONAL] [ARGUMENT=1+]
>       tcp-ping list of url and print result: -T=timeout/5000, $@=...urlList
>   --server-serve-static --sss [OPTIONAL] [ARGUMENT=0-1]
>       static file server: -H=hostname:port, -R=staticRoot/cwd, $0=expireTime/5*1000
>   --server-serve-static-simple --ssss [OPTIONAL] [ARGUMENT=0-1]
>       static file server, no HTML: -H=hostname:port, -R=staticRoot/cwd, $0=expireTime/5*1000
>   --server-serve-static-api --sssa [OPTIONAL] [ARGUMENT=0-1]
>       static API server, no HTML, will map "POST /a/b/c" to static file with name "#a#b#c#[POST]": -H=hostname:port, -R=staticRoot/cwd, $0=expireTime/5*1000
>   --server-websocket-group --swg [OPTIONAL]
>       websocket chat server: -H=hostname:port
>   --server-test-connection --stc [OPTIONAL]
>       connection test server: -H=hostname:port
>   --server-test-connection-simple --stcs [OPTIONAL]
>       connection test server, just log all & json back: -H=hostname:port
>   --server-test-connection-simple-payload --stcsp [OPTIONAL]
>       connection test server, just log all & json back with payload-base64: -H=hostname:port
>   --server-tcp-proxy --stp [OPTIONAL] [ARGUMENT=1+]
>       tcp proxy server: -H=hostname:port, $@=toHostname:toPort,toHostname:toPort,...
>   --server-http-request-proxy --shrp [OPTIONAL] [ARGUMENT=1+]
>       HTTP per-request proxy server: -H=hostname:port, -T=timeout/42000, $0=toOrigin, $1=isSetXForward/false
>   --reset-bash-combo --RBC [OPTIONAL] [ARGUMENT=0-1]
>       setup bashrc & alias
>   --shell-alias --SA --A -A [OPTIONAL] [ARGUMENT=1+]
>       run shell alias: $@=aliasName,...aliasArgList
>   --version-bump-git-branch --VBGB [OPTIONAL] [ARGUMENT=0-1]
>       bump package version by git branch: -G=isGitCommit, -D=isDevCommit, $GIT_MAJOR_BRANCH=master,main,major,...
>   --version-bump-last-number --VBLN [OPTIONAL] [ARGUMENT=0-1]
>       bump the last number found in package version: -G, -D
>   --version-bump-to-identifier --VBTI [OPTIONAL] [ARGUMENT=0-1]
>       bump package version to identifier: -G, -D, $0=labelIdentifier/dev
>   --version-bump-to-local --VBTL [OPTIONAL] [ARGUMENT=0-1]
>       bump package version to append identifier "local", for local testing: -G, -D
>   --version-bump-to-major --VBTM [OPTIONAL] [ARGUMENT=0-1]
>       bump package version and drop label: -G, -D
>   --version-bump-push-check --VBPC [OPTIONAL] [ARGUMENT=0-1]
>       check "WIP" message in dev commit, optionally run "quick-git-push-combo" shell-alias: -G=isRunQGPC
>   --package-trim-node-modules --PTNM [OPTIONAL] [ARGUMENT=1+]
>       trim common doc/test/config in "node_modules/": $@=...pathList
>   --package-trim-ruby-gem --PTRG [OPTIONAL] [ARGUMENT=1+]
>       trim common doc/test/config in "lib/ruby/gems/*/gems/": $@=...pathList
>   --test [OPTIONAL] [ARGUMENT=1+]
>       list of path to look test file from, default to ".": $@=...pathList, -T=timeoutForEachTest/42000
>     --test-file-suffix --TFS [ARGUMENT=1+]
>         pattern for test file, default to ".js"
>     --test-load --TL [ARGUMENT=1+]
>         module or file to (import/require) before test files, mostly for patching "globalThis"
>   --parse-script [OPTIONAL] [ARGUMENT=1+]
>       parse and echo: $@=scriptName,...extraArgs
>   --parse-script-list [OPTIONAL] [ARGUMENT=1+]
>       combine multi-script, but no extraArgs: $@=...scriptNameList
>   --run-script --rs [OPTIONAL] [ARGUMENT=1+]
>       parse and run: $@=scriptName,...extraArgs
>   --run-script-list --rsl [OPTIONAL] [ARGUMENT=1+]
>       combine multi-script, but no extraArgs: $@=...scriptNameList
>   --check-outdated --C -C [OPTIONAL] [ARGUMENT=0-1]
>       check dependency version from "package.json", or all under the folder: $0/-R=checkPath/"./package.json"
>     --buggy-tag --bt [ARGUMENT=0-1]
>         set to ANY value to enable, except "false/no/n/0"
>     --write-back --wb [ARGUMENT=0-1]
>         set to ANY value to enable, except "false/no/n/0"
>     --path-temp [ARGUMENT=1]
>         use "AUTO" for os temp,set will disable in-place check for single "package.json"
>   --exec --E -E [OPTIONAL] [ARGUMENT=1+]
>       exec command, allow set env and cwd: $@=command, ...argList
>     --exec-env --EE [ARGUMENT=0-1]
>         use URLSearchParams format String, or key-value Object
>     --exec-cwd --EC [ARGUMENT=0-1]
>         reset cwd to path
> ENV Usage:
>   "
>     #!/usr/bin/env bash
>     export DR_JS_CONFIG="[OPTIONAL] [ARGUMENT=1]"
>     export DR_JS_HELP="[OPTIONAL] [ARGUMENT=0-1]"
>     export DR_JS_VERSION="[OPTIONAL] [ARGUMENT=0-1]"
>     export DR_JS_NOTE="[OPTIONAL] [ARGUMENT=1+]"
>     export DR_JS_QUIET="[OPTIONAL] [ARGUMENT=0-1]"
>     export DR_JS_INPUT_FILE="[OPTIONAL] [ARGUMENT=1]"
>     export DR_JS_OUTPUT_FILE="[OPTIONAL] [ARGUMENT=1]"
>     export DR_JS_PID_FILE="[OPTIONAL] [ARGUMENT=1] [ALIAS=DR_JS_PID]"
>     export DR_JS_HOST="[OPTIONAL] [ARGUMENT=1]"
>     export DR_JS_ROUTE_PREFIX="[OPTIONAL] [ARGUMENT=1] [ALIAS=DR_JS_RP]"
>     export DR_JS_ROOT="[OPTIONAL] [ARGUMENT=1]"
>     export DR_JS_TIMEOUT="[OPTIONAL] [ARGUMENT=1]"
>     export DR_JS_GIT_COMMIT="[OPTIONAL] [ARGUMENT=0-1]"
>     export DR_JS_DEBUG="[OPTIONAL] [ARGUMENT=0-1]"
>     export DR_JS_JSON="[OPTIONAL] [ARGUMENT=0-1]"
>     export DR_JS_EVAL="[OPTIONAL] [ARGUMENT=0+]"
>     export DR_JS_REPL="[OPTIONAL] [ARGUMENT=0-1]"
>     export DR_JS_FETCH="[OPTIONAL] [ARGUMENT=1-3]"
>     export DR_JS_WAIT="[OPTIONAL] [ARGUMENT=0-1]"
>     export DR_JS_ECHO="[OPTIONAL] [ARGUMENT=0+]"
>     export DR_JS_CAT="[OPTIONAL] [ARGUMENT=0+]"
>     export DR_JS_WRITE="[OPTIONAL] [ARGUMENT=1]"
>     export DR_JS_APPEND="[OPTIONAL] [ARGUMENT=1]"
>     export DR_JS_TEXT_FILE="[OPTIONAL] [ARGUMENT=0-1] [ALIAS=DR_JS_TXT]"
>     export DR_JS_TEXT_REPLACE="[OPTIONAL] [ARGUMENT=2] [ALIAS=DR_JS_TR]"
>     export DR_JS_TEXT_REPLACE_ALL="[OPTIONAL] [ARGUMENT=2] [ALIAS=DR_JS_TRA]"
>     export DR_JS_MERGE="[OPTIONAL] [ARGUMENT=2+]"
>     export DR_JS_CREATE_DIRECTORY="[OPTIONAL] [ARGUMENT=0+] [ALIAS=DR_JS_MKDIR]"
>     export DR_JS_MODIFY_COPY="[OPTIONAL] [ARGUMENT=2] [ALIAS=DR_JS_CP]"
>     export DR_JS_MODIFY_RENAME="[OPTIONAL] [ARGUMENT=2] [ALIAS=DR_JS_MV]"
>     export DR_JS_MODIFY_DELETE="[OPTIONAL] [ARGUMENT=0+] [ALIAS=DR_JS_RM]"
>     export DR_JS_STATUS="[OPTIONAL] [ARGUMENT=0-1]"
>     export DR_JS_OPEN="[OPTIONAL] [ARGUMENT=0-2]"
>     export DR_JS_WHICH="[OPTIONAL] [ARGUMENT=1]"
>     export DR_JS_RUN="[OPTIONAL] [ARGUMENT=0+]"
>     export DR_JS_DETACH="[OPTIONAL] [ARGUMENT=0+] [ALIAS=DR_JS_BG]"
>     export DR_JS_PROCESS_STATUS="[OPTIONAL] [ARGUMENT=0-1] [ALIAS=DR_JS_PS]"
>     export DR_JS_PROCESS_SIGNAL="[OPTIONAL] [ARGUMENT=0-2] [ALIAS=DR_JS_SIG]"
>     export DR_JS_JSON_FORMAT="[OPTIONAL] [ARGUMENT=0-1] [ALIAS=DR_JS_JF]"
>     export DR_JS_ENCODE="[OPTIONAL] [ARGUMENT=1] [ALIAS=DR_JS_ENC]"
>     export DR_JS_DECODE="[OPTIONAL] [ARGUMENT=1] [ALIAS=DR_JS_DEC]"
>     export DR_JS_FILE_LIST="[OPTIONAL] [ARGUMENT=0-1] [ALIAS=DR_JS_LS]"
>     export DR_JS_FILE_LIST_ALL="[OPTIONAL] [ARGUMENT=0-1] [ALIAS=DR_JS_LS_R,DR_JS_LLA]"
>     export DR_JS_FILE_TREE="[OPTIONAL] [ARGUMENT=0-1] [ALIAS=DR_JS_TREE]"
>     export DR_JS_COMPRESS="[OPTIONAL] [ARGUMENT=0-1]"
>     export DR_JS_EXTRACT="[OPTIONAL] [ARGUMENT=0-1]"
>     export DR_JS_DOCKER="[OPTIONAL] [ARGUMENT=1+] [ALIAS=DR_JS_DK]"
>     export DR_JS_DOCKER_COMPOSE="[OPTIONAL] [ARGUMENT=1+] [ALIAS=DR_JS_DC]"
>     export DR_JS_AUTH_FILE_DESCRIBE="[OPTIONAL] [ARGUMENT=0-1]"
>     export DR_JS_AUTH_CHECK_CODE_GENERATE="[OPTIONAL] [ARGUMENT=0-1]"
>     export DR_JS_AUTH_CHECK_CODE_VERIFY="[OPTIONAL] [ARGUMENT=1-2]"
>     export DR_JS_AUTH_GEN_TAG="[OPTIONAL] [ARGUMENT=1]"
>     export DR_JS_AUTH_GEN_SIZE="[ARGUMENT=1]"
>     export DR_JS_AUTH_GEN_TOKEN_SIZE="[ARGUMENT=1]"
>     export DR_JS_AUTH_GEN_TIME_GAP="[ARGUMENT=1]"
>     export DR_JS_AUTH_GEN_INFO="[ARGUMENT=1]"
>     export DR_JS_PING_RACE="[OPTIONAL] [ARGUMENT=1+]"
>     export DR_JS_PING_STAT="[OPTIONAL] [ARGUMENT=1+]"
>     export DR_JS_SERVER_SERVE_STATIC="[OPTIONAL] [ARGUMENT=0-1] [ALIAS=DR_JS_SSS]"
>     export DR_JS_SERVER_SERVE_STATIC_SIMPLE="[OPTIONAL] [ARGUMENT=0-1] [ALIAS=DR_JS_SSSS]"
>     export DR_JS_SERVER_SERVE_STATIC_API="[OPTIONAL] [ARGUMENT=0-1] [ALIAS=DR_JS_SSSA]"
>     export DR_JS_SERVER_WEBSOCKET_GROUP="[OPTIONAL] [ALIAS=DR_JS_SWG]"
>     export DR_JS_SERVER_TEST_CONNECTION="[OPTIONAL] [ALIAS=DR_JS_STC]"
>     export DR_JS_SERVER_TEST_CONNECTION_SIMPLE="[OPTIONAL] [ALIAS=DR_JS_STCS]"
>     export DR_JS_SERVER_TEST_CONNECTION_SIMPLE_PAYLOAD="[OPTIONAL] [ALIAS=DR_JS_STCSP]"
>     export DR_JS_SERVER_TCP_PROXY="[OPTIONAL] [ARGUMENT=1+] [ALIAS=DR_JS_STP]"
>     export DR_JS_SERVER_HTTP_REQUEST_PROXY="[OPTIONAL] [ARGUMENT=1+] [ALIAS=DR_JS_SHRP]"
>     export DR_JS_RESET_BASH_COMBO="[OPTIONAL] [ARGUMENT=0-1] [ALIAS=DR_JS_RBC]"
>     export DR_JS_SHELL_ALIAS="[OPTIONAL] [ARGUMENT=1+] [ALIAS=DR_JS_SA]"
>     export DR_JS_VERSION_BUMP_GIT_BRANCH="[OPTIONAL] [ARGUMENT=0-1] [ALIAS=DR_JS_VBGB]"
>     export DR_JS_VERSION_BUMP_LAST_NUMBER="[OPTIONAL] [ARGUMENT=0-1] [ALIAS=DR_JS_VBLN]"
>     export DR_JS_VERSION_BUMP_TO_IDENTIFIER="[OPTIONAL] [ARGUMENT=0-1] [ALIAS=DR_JS_VBTI]"
>     export DR_JS_VERSION_BUMP_TO_LOCAL="[OPTIONAL] [ARGUMENT=0-1] [ALIAS=DR_JS_VBTL]"
>     export DR_JS_VERSION_BUMP_TO_MAJOR="[OPTIONAL] [ARGUMENT=0-1] [ALIAS=DR_JS_VBTM]"
>     export DR_JS_VERSION_BUMP_PUSH_CHECK="[OPTIONAL] [ARGUMENT=0-1] [ALIAS=DR_JS_VBPC]"
>     export DR_JS_PACKAGE_TRIM_NODE_MODULES="[OPTIONAL] [ARGUMENT=1+] [ALIAS=DR_JS_PTNM]"
>     export DR_JS_PACKAGE_TRIM_RUBY_GEM="[OPTIONAL] [ARGUMENT=1+] [ALIAS=DR_JS_PTRG]"
>     export DR_JS_TEST="[OPTIONAL] [ARGUMENT=1+]"
>     export DR_JS_TEST_FILE_SUFFIX="[ARGUMENT=1+] [ALIAS=DR_JS_TFS]"
>     export DR_JS_TEST_LOAD="[ARGUMENT=1+] [ALIAS=DR_JS_TL]"
>     export DR_JS_PARSE_SCRIPT="[OPTIONAL] [ARGUMENT=1+]"
>     export DR_JS_PARSE_SCRIPT_LIST="[OPTIONAL] [ARGUMENT=1+]"
>     export DR_JS_RUN_SCRIPT="[OPTIONAL] [ARGUMENT=1+] [ALIAS=DR_JS_RS]"
>     export DR_JS_RUN_SCRIPT_LIST="[OPTIONAL] [ARGUMENT=1+] [ALIAS=DR_JS_RSL]"
>     export DR_JS_CHECK_OUTDATED="[OPTIONAL] [ARGUMENT=0-1]"
>     export DR_JS_BUGGY_TAG="[ARGUMENT=0-1] [ALIAS=DR_JS_BT]"
>     export DR_JS_WRITE_BACK="[ARGUMENT=0-1] [ALIAS=DR_JS_WB]"
>     export DR_JS_PATH_TEMP="[ARGUMENT=1]"
>     export DR_JS_EXEC="[OPTIONAL] [ARGUMENT=1+]"
>     export DR_JS_EXEC_ENV="[ARGUMENT=0-1] [ALIAS=DR_JS_EE]"
>     export DR_JS_EXEC_CWD="[ARGUMENT=0-1] [ALIAS=DR_JS_EC]"
>   "
> CONFIG Usage:
>   {
>     "config": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "help": [ "[OPTIONAL] [ARGUMENT=0-1]" ],
>     "version": [ "[OPTIONAL] [ARGUMENT=0-1]" ],
>     "note": [ "[OPTIONAL] [ARGUMENT=1+]" ],
>     "quiet": [ "[OPTIONAL] [ARGUMENT=0-1]" ],
>     "inputFile": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "outputFile": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "pidFile": [ "[OPTIONAL] [ARGUMENT=1] [ALIAS=pid]" ],
>     "host": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "routePrefix": [ "[OPTIONAL] [ARGUMENT=1] [ALIAS=RP]" ],
>     "root": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "timeout": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "gitCommit": [ "[OPTIONAL] [ARGUMENT=0-1]" ],
>     "debug": [ "[OPTIONAL] [ARGUMENT=0-1]" ],
>     "json": [ "[OPTIONAL] [ARGUMENT=0-1]" ],
>     "eval": [ "[OPTIONAL] [ARGUMENT=0+]" ],
>     "repl": [ "[OPTIONAL] [ARGUMENT=0-1]" ],
>     "fetch": [ "[OPTIONAL] [ARGUMENT=1-3]" ],
>     "wait": [ "[OPTIONAL] [ARGUMENT=0-1]" ],
>     "echo": [ "[OPTIONAL] [ARGUMENT=0+]" ],
>     "cat": [ "[OPTIONAL] [ARGUMENT=0+]" ],
>     "write": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "append": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "textFile": [ "[OPTIONAL] [ARGUMENT=0-1] [ALIAS=txt]" ],
>     "textReplace": [ "[OPTIONAL] [ARGUMENT=2] [ALIAS=tr]" ],
>     "textReplaceAll": [ "[OPTIONAL] [ARGUMENT=2] [ALIAS=tra]" ],
>     "merge": [ "[OPTIONAL] [ARGUMENT=2+]" ],
>     "createDirectory": [ "[OPTIONAL] [ARGUMENT=0+] [ALIAS=mkdir]" ],
>     "modifyCopy": [ "[OPTIONAL] [ARGUMENT=2] [ALIAS=cp]" ],
>     "modifyRename": [ "[OPTIONAL] [ARGUMENT=2] [ALIAS=mv]" ],
>     "modifyDelete": [ "[OPTIONAL] [ARGUMENT=0+] [ALIAS=rm]" ],
>     "status": [ "[OPTIONAL] [ARGUMENT=0-1]" ],
>     "open": [ "[OPTIONAL] [ARGUMENT=0-2]" ],
>     "which": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "run": [ "[OPTIONAL] [ARGUMENT=0+]" ],
>     "detach": [ "[OPTIONAL] [ARGUMENT=0+] [ALIAS=bg]" ],
>     "processStatus": [ "[OPTIONAL] [ARGUMENT=0-1] [ALIAS=ps]" ],
>     "processSignal": [ "[OPTIONAL] [ARGUMENT=0-2] [ALIAS=sig]" ],
>     "jsonFormat": [ "[OPTIONAL] [ARGUMENT=0-1] [ALIAS=jf]" ],
>     "encode": [ "[OPTIONAL] [ARGUMENT=1] [ALIAS=enc]" ],
>     "decode": [ "[OPTIONAL] [ARGUMENT=1] [ALIAS=dec]" ],
>     "fileList": [ "[OPTIONAL] [ARGUMENT=0-1] [ALIAS=ls]" ],
>     "fileListAll": [ "[OPTIONAL] [ARGUMENT=0-1] [ALIAS=lsR,lla]" ],
>     "fileTree": [ "[OPTIONAL] [ARGUMENT=0-1] [ALIAS=tree]" ],
>     "compress": [ "[OPTIONAL] [ARGUMENT=0-1]" ],
>     "extract": [ "[OPTIONAL] [ARGUMENT=0-1]" ],
>     "docker": [ "[OPTIONAL] [ARGUMENT=1+] [ALIAS=dk]" ],
>     "dockerCompose": [ "[OPTIONAL] [ARGUMENT=1+] [ALIAS=dc]" ],
>     "authFileDescribe": [ "[OPTIONAL] [ARGUMENT=0-1]" ],
>     "authCheckCodeGenerate": [ "[OPTIONAL] [ARGUMENT=0-1]" ],
>     "authCheckCodeVerify": [ "[OPTIONAL] [ARGUMENT=1-2]" ],
>     "authGenTag": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "authGenSize": [ "[ARGUMENT=1]" ],
>     "authGenTokenSize": [ "[ARGUMENT=1]" ],
>     "authGenTimeGap": [ "[ARGUMENT=1]" ],
>     "authGenInfo": [ "[ARGUMENT=1]" ],
>     "pingRace": [ "[OPTIONAL] [ARGUMENT=1+]" ],
>     "pingStat": [ "[OPTIONAL] [ARGUMENT=1+]" ],
>     "serverServeStatic": [ "[OPTIONAL] [ARGUMENT=0-1] [ALIAS=sss]" ],
>     "serverServeStaticSimple": [ "[OPTIONAL] [ARGUMENT=0-1] [ALIAS=ssss]" ],
>     "serverServeStaticApi": [ "[OPTIONAL] [ARGUMENT=0-1] [ALIAS=sssa]" ],
>     "serverWebsocketGroup": [ "[OPTIONAL] [ALIAS=swg]" ],
>     "serverTestConnection": [ "[OPTIONAL] [ALIAS=stc]" ],
>     "serverTestConnectionSimple": [ "[OPTIONAL] [ALIAS=stcs]" ],
>     "serverTestConnectionSimplePayload": [ "[OPTIONAL] [ALIAS=stcsp]" ],
>     "serverTcpProxy": [ "[OPTIONAL] [ARGUMENT=1+] [ALIAS=stp]" ],
>     "serverHttpRequestProxy": [ "[OPTIONAL] [ARGUMENT=1+] [ALIAS=shrp]" ],
>     "resetBashCombo": [ "[OPTIONAL] [ARGUMENT=0-1] [ALIAS=RBC]" ],
>     "shellAlias": [ "[OPTIONAL] [ARGUMENT=1+] [ALIAS=SA]" ],
>     "versionBumpGitBranch": [ "[OPTIONAL] [ARGUMENT=0-1] [ALIAS=VBGB]" ],
>     "versionBumpLastNumber": [ "[OPTIONAL] [ARGUMENT=0-1] [ALIAS=VBLN]" ],
>     "versionBumpToIdentifier": [ "[OPTIONAL] [ARGUMENT=0-1] [ALIAS=VBTI]" ],
>     "versionBumpToLocal": [ "[OPTIONAL] [ARGUMENT=0-1] [ALIAS=VBTL]" ],
>     "versionBumpToMajor": [ "[OPTIONAL] [ARGUMENT=0-1] [ALIAS=VBTM]" ],
>     "versionBumpPushCheck": [ "[OPTIONAL] [ARGUMENT=0-1] [ALIAS=VBPC]" ],
>     "packageTrimNodeModules": [ "[OPTIONAL] [ARGUMENT=1+] [ALIAS=PTNM]" ],
>     "packageTrimRubyGem": [ "[OPTIONAL] [ARGUMENT=1+] [ALIAS=PTRG]" ],
>     "test": [ "[OPTIONAL] [ARGUMENT=1+]" ],
>     "testFileSuffix": [ "[ARGUMENT=1+] [ALIAS=TFS]" ],
>     "testLoad": [ "[ARGUMENT=1+] [ALIAS=TL]" ],
>     "parseScript": [ "[OPTIONAL] [ARGUMENT=1+]" ],
>     "parseScriptList": [ "[OPTIONAL] [ARGUMENT=1+]" ],
>     "runScript": [ "[OPTIONAL] [ARGUMENT=1+] [ALIAS=rs]" ],
>     "runScriptList": [ "[OPTIONAL] [ARGUMENT=1+] [ALIAS=rsl]" ],
>     "checkOutdated": [ "[OPTIONAL] [ARGUMENT=0-1]" ],
>     "buggyTag": [ "[ARGUMENT=0-1] [ALIAS=bt]" ],
>     "writeBack": [ "[ARGUMENT=0-1] [ALIAS=wb]" ],
>     "pathTemp": [ "[ARGUMENT=1]" ],
>     "exec": [ "[OPTIONAL] [ARGUMENT=1+]" ],
>     "execEnv": [ "[ARGUMENT=0-1] [ALIAS=EE]" ],
>     "execCwd": [ "[ARGUMENT=0-1] [ALIAS=EC]" ],
>   }
> ```
