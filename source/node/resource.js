import { promises as fsAsync } from 'fs'
import { runInThisContext } from 'vm'
import { fetchLikeRequest } from 'source/node/net.js'

// TODO: check if is needed, or simplify
const loadRemoteScript = async (uri) => { // TODO: DEPRECATE: move to `@dr-js/node`
  const scriptString = await (await fetchLikeRequest(uri)).text()
  return runInThisContext(scriptString, { filename: uri, displayErrors: true })
}
const loadLocalScript = async (filePath) => { // TODO: DEPRECATE: move to `@dr-js/node`
  const scriptString = String(await fsAsync.readFile(filePath))
  return runInThisContext(scriptString, { filename: filePath, displayErrors: true })
}
const loadScript = (uri) => uri.includes('://') // TODO: DEPRECATE: move to `@dr-js/node`
  ? loadRemoteScript(uri)
  : loadLocalScript(uri)

const loadRemoteJSON = async (uri) => (await fetchLikeRequest(uri)).json() // TODO: DEPRECATE: move to `@dr-js/node`
const loadLocalJSON = async (filePath) => JSON.parse(String(await fsAsync.readFile(filePath))) // TODO: DEPRECATE: move to `@dr-js/node`
const loadJSON = (uri) => uri.includes('://') // TODO: DEPRECATE: move to `@dr-js/node`
  ? loadRemoteJSON(uri)
  : loadLocalJSON(uri)

export {
  loadRemoteScript, loadLocalScript, loadScript, // TODO: DEPRECATE: move to `@dr-js/node`
  loadRemoteJSON, loadLocalJSON, loadJSON // TODO: DEPRECATE: move to `@dr-js/node`
}

export { DR_BROWSER_FILE_PATH, DR_BROWSER_SCRIPT_TAG } from 'source/node/server/function.js' // TODO: DEPRECATE
