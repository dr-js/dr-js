# Shortcut Usage


## Bin mode: `eval`

basic syntax:
```bash
# NOTE: require path is from `bin/index`
# NOTE: `global.evalArgv` is array of input arguments (without script string)

# eval script string
dr-js\
  -e "require('../library/common/format').describe(evalArgv)"\
    arg0 arg1 "arg2 with space"

# eval input script file
echo "require('../library/common/format').describe(evalArgv)" > test-eval.js
dr-js\
  -I test-eval.js\
  -e arg0 arg1 "arg2 with space"

# for result & output log
dr-js\
  -e "console.log(evalArgv), 123" arg0 arg1 > output.log

# for result only
dr-js\
  -O result.txt\
  -e "console.log(evalArgv), 123" arg0 arg1
```


#### Some helpful quick composed shell scripts

some maybe good enough to be a shell alias

- format JSON
  > for cut up super-long JSON, or fold super-deep ones
  > ```bash
  > ARG0_FILE_JSON=package-lock.json
  > ARG1_FORMAT_JSON_LEVEL=3
  > 
  > dr-js\
  >   -O result.json\
  >   -e "require('../library/common/format').prettyStringifyJSON(JSON.parse(require('fs').readFileSync(evalArgv[ 0 ])), evalArgv[ 1 ])"\
  >   ${ARG0_FILE_JSON} ${ARG1_FORMAT_JSON_LEVEL}
  > ```
