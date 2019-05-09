import { readFileSync } from 'fs'
import { runInThisContext } from 'vm'
import { tryRequireResolve } from 'source/env/tryRequire'
import { fetchLikeRequest } from 'source/node/net'
import { readFileAsync } from 'source/node/file/function'

const DR_BROWSER_FILE_PATH = () => [
  // should pass within normal node_module structure
  `dr-js/library/Dr.browser.js`,
  // maybe webpack, try some relative path
  `${__dirname}/../library/Dr.browser.js`,
  `${__dirname}/Dr.browser.js`,
  `Dr.browser.js`
].reduce((o, path) => o || tryRequireResolve(path), null)

let cache
const DR_BROWSER_SCRIPT_TAG = () => {
  if (cache === undefined) cache = `<script>${readFileSync(DR_BROWSER_FILE_PATH())}</script>`
  return cache
}

// TODO: check if is needed, or simplify
const loadRemoteScript = async (uri) => {
  const scriptString = await (await fetchLikeRequest(uri)).text()
  return runInThisContext(scriptString, { filename: uri, displayErrors: true })
}
const loadLocalScript = async (filePath) => {
  const scriptString = String(await readFileAsync(filePath))
  return runInThisContext(scriptString, { filename: filePath, displayErrors: true })
}
const loadScript = (uri) => uri.includes('://')
  ? loadRemoteScript(uri)
  : loadLocalScript(uri)

const loadRemoteJSON = async (uri) => (await fetchLikeRequest(uri)).json()
const loadLocalJSON = async (filePath) => JSON.parse(await readFileAsync(filePath))
const loadJSON = (uri) => uri.includes('://')
  ? loadRemoteJSON(uri)
  : loadLocalJSON(uri)

export {
  DR_BROWSER_FILE_PATH, DR_BROWSER_SCRIPT_TAG,
  loadRemoteScript, loadLocalScript, loadScript,
  loadRemoteJSON, loadLocalJSON, loadJSON
}
