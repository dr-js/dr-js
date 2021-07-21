import { runInThisContext } from 'vm'
import { readText, readJSON } from 'source/node/fs/File.js'
import { fetchLikeRequest } from 'source/node/net.js'

// TODO: check if is needed, or simplify
const loadRemoteScript = async (uri) => { // TODO: DEPRECATE: moved to `@dr-js/dev`
  const scriptString = await (await fetchLikeRequest(uri)).text()
  return runInThisContext(scriptString, { filename: uri, displayErrors: true })
}
const loadLocalScript = async (filePath) => { // TODO: DEPRECATE: moved to `@dr-js/dev`
  const scriptString = await readText(filePath)
  return runInThisContext(scriptString, { filename: filePath, displayErrors: true })
}
const loadScript = (uri) => uri.includes('://') // TODO: DEPRECATE: moved to `@dr-js/dev`
  ? loadRemoteScript(uri)
  : loadLocalScript(uri)

const loadRemoteJSON = async (uri) => (await fetchLikeRequest(uri)).json() // TODO: DEPRECATE: moved to `@dr-js/dev`
const loadLocalJSON = readJSON // TODO: DEPRECATE: moved to `@dr-js/dev`
const loadJSON = (uri) => uri.includes('://') // TODO: DEPRECATE: moved to `@dr-js/dev`
  ? loadRemoteJSON(uri)
  : loadLocalJSON(uri)

export {
  loadRemoteScript, loadLocalScript, loadScript, // TODO: DEPRECATE: moved to `@dr-js/dev`
  loadRemoteJSON, loadLocalJSON, loadJSON // TODO: DEPRECATE: moved to `@dr-js/dev`
}

export { DR_BROWSER_FILE_PATH, DR_BROWSER_SCRIPT_TAG } from 'source/node/server/function.js' // TODO: DEPRECATE
