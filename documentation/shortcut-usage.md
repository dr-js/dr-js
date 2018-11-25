# Shortcut Usage


## Bin mode: `eval`

run script string or load script file, with `require('dr-js')` available

NOTE: (of the weirdness, may get changed later)
- `evalArgv` is array of input arguments (without the script string, if used)
- `evalCwd` is the directory if the script file, or cwd if with script string
- `require()` starts from `dr-js/bin/index`,
   so `require('dr-js/library/common/format')` or `require('../library/common/format')` both works
- the `require()` in files outside of the start file,
   should not call `require('dr-js')`,
   because `module.paths` has changed, and reverse lookup will not find the right `node_modules`

basic usage syntax:

- eval script string
  > ```bash
  > dr-js\
  >   -e "return require('dr-js/library/common/format').describe(evalArgv)"\
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
  >   -e "return require('dr-js/library/common/format').prettyStringifyJSON(JSON.parse(require('fs').readFileSync(evalArgv[ 0 ])), evalArgv[ 1 ])"\
  >   ${ARG0_FILE_JSON} ${ARG1_FORMAT_JSON_LEVEL}
  > ```

- simple TimedLookup
  > ```bash
  > dr-js -e "$(cat <<- 'EOM'
  >   const { generateLookupData, generateCheckCode, verifyCheckCode, packDataArrayBuffer, parseDataArrayBuffer } = require('dr-js/library/common/module/TimedLookup')
  >   const { toArrayBuffer } = require('dr-js/library/node/data/Buffer')
  >   const { readFileSync } = require('fs')
  >   const [ mode, ...extraArgv ] = evalArgv
  >   switch (mode) {
  >     case 'file-generate': case 'fg': {
  >       const [ tag, size, tokenSize, timeGap ] = extraArgv
  >       return Buffer.from(packDataArrayBuffer(generateLookupData({ tag, size, tokenSize, timeGap })))
  >     }
  >     case 'check-code-generate': case 'ccg': {
  >       const [ timestamp ] = extraArgv
  >       return generateCheckCode(
  >         parseDataArrayBuffer(toArrayBuffer(readFileSync(getSingleOption('root')))),
  >         Number(timestamp) || undefined
  >       )
  >     }
  >     case 'check-code-verify': case 'ccv': {
  >       const [ checkCode, timestamp ] = extraArgv
  >       return verifyCheckCode(
  >         parseDataArrayBuffer(toArrayBuffer(readFileSync(getSingleOption('root')))),
  >         checkCode,
  >         Number(timestamp) || undefined
  >       )
  >     }
  >   }
  >   throw new Error(`unknown mode: ${mode}`)
  > EOM
  > )"
  > ```