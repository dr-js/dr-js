import { resolve, dirname } from 'path'

// HACK: add `@dr-js/core` to internal `modulePaths` to allow require
// code: https://github.com/nodejs/node/blob/v12.11.1/lib/internal/modules/cjs/loader.js#L620
//   > $ dr-js -e console.log(module.filename)
//   >   .../npm/node_modules/@dr-js/core/bin/function.js
const modulePathHack = () => require('module')._resolveLookupPaths('modulePaths').push(resolve(module.filename, '../../../../'))

const evalScript = ( // NOTE: use eval not Function to derive local
  evalScriptString, // inputFile ? String(readFileSync(inputFile)) : argumentList[ 0 ]
  evalScriptPath, // inputFile || resolve('__SCRIPT_STRING__'),
  evalArgv, // inputFile ? argumentList : argumentList.slice(1)
  evalOption // optionData
) => eval(`async (evalArgv, evalOption, __filename, __dirname, require) => { ${evalScriptString} }`)( // eslint-disable-line no-eval
  evalArgv, // NOTE: allow both evalArgv / argumentList is accessible from eval
  evalOption,
  evalScriptPath,
  dirname(evalScriptPath),
  require('module').createRequire(evalScriptPath)
)

export { // TODO: NOTE: only borrow script from here for test or for another bin/script, may cause bloat if webpack use both module/library
  modulePathHack,
  evalScript
}
