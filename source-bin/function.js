import { resolve, dirname } from 'path'

import { fetchLikeRequest } from '@dr-js/core/module/node/net'

// HACK: add `@dr-js/core` to internal `modulePaths` to allow require
// code: https://github.com/nodejs/node/blob/v12.11.1/lib/internal/modules/cjs/loader.js#L620
//   > $ dr-js -e console.log(module.filename)
//   >   .../npm/node_modules/@dr-js/core/bin/function.js
const modulePathHack = () => require('module')._resolveLookupPaths('modulePaths').push(resolve(module.filename, '../../../../'))

const evalScript = ( // NOTE: use eval not Function to derive local
  evalScriptString, // inputFile ? String(readFileSync(inputFile)) : argumentList[ 0 ]
  evalScriptPath, // inputFile || resolve(process.cwd(), '__SCRIPT_STRING__'),
  evalArgv, // inputFile ? argumentList : argumentList.slice(1)
  evalOption // optionData
) => eval(`async (evalArgv, evalOption, __filename, __dirname, require) => { ${evalScriptString} }`)( // eslint-disable-line no-eval
  evalArgv, // NOTE: allow both evalArgv / argumentList is accessible from eval
  evalOption,
  evalScriptPath,
  dirname(evalScriptPath),
  require('module').createRequire(evalScriptPath)
)

const fetchWithJump = async (
  initialUrl,
  option = {},
  jumpMax = 0, // 0 for unlimited jump
  onFetchStart // = (url, jumpCount, cookieList) => {}
) => {
  let url = initialUrl
  let jumpCount = 0
  let cookieList = [ option.headers && option.headers.cookie ].filter(Boolean)
  while (true) {
    onFetchStart && await onFetchStart(url, jumpCount, cookieList)
    const response = await fetchLikeRequest(url, { ...option, headers: { ...option.headers, 'cookie': cookieList.join(';') } })
    const getInfo = () => JSON.stringify({ url, status: response.status, headers: response.headers }, null, 2)
    if (response.ok) return response
    else if (response.status >= 300 && response.status <= 399 && response.headers[ 'location' ]) {
      jumpCount++
      if (jumpCount > jumpMax) throw new Error(`${jumpMax} max jump reached: ${getInfo()}`)
      url = new URL(response.headers[ 'location' ], url).href
      cookieList = [ ...cookieList, ...(response.headers[ 'set-cookie' ] || []).map((v) => v.split(';')[ 0 ]) ]
    } else throw new Error(`bad status: ${getInfo()}`)
  }
}

export { // TODO: NOTE: only borrow script from here for test or for another bin/script, may cause bloat if webpack use both module/library
  modulePathHack,
  evalScript,
  fetchWithJump
}
