# Shortcut Usage


## Bin mode: `eval`

basic usage syntax:

- eval script string
  > NOTE: 
  >   `require()` starts from `dr-js/bin/index`,
  >   `evalArgv` is array of input arguments (without the script string, if used)
  > ```bash
  > dr-js\
  >   -e "return require('../library/common/format').describe(evalArgv)"\
  >     arg0 arg1 "arg2 with space"
  > ```
- for result & output log
  > ```bash
  > dr-js\
  >   -e "return console.log(evalArgv), 123" arg0 arg1 > output.log
  > ```
- for result only
  > ```bash
  > dr-js\
  >   -O result.txt\
  >   -e "return console.log(evalArgv), 123" arg0 arg1
  > ```

some helpful quick composed shell scripts:

- format JSON
  > for cut up super-long JSON, or fold super-deep ones
  > ```bash
  > ARG0_FILE_JSON=package-lock.json
  > ARG1_FORMAT_JSON_LEVEL=3
  > 
  > dr-js\
  >   -O result.json\
  >   -e "return require('../library/common/format').prettyStringifyJSON(JSON.parse(require('fs').readFileSync(evalArgv[ 0 ])), evalArgv[ 1 ])"\
  >   ${ARG0_FILE_JSON} ${ARG1_FORMAT_JSON_LEVEL}
  > ```
