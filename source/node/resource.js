import { runInThisContext } from 'vm'
import { readText, readJSON } from 'source/node/fs/File.js'
import { fetchLikeRequest } from 'source/node/net.js'
import { DR_BROWSER_FILE_PATH, DR_BROWSER_SCRIPT_TAG } from 'source/node/server/function.js' // TODO: DEPRECATE

// TODO: check if is needed, or simplify
/** @deprecated */ const loadRemoteScript = async (uri) => { // TODO: DEPRECATE: moved to `@dr-js/dev`
  const scriptString = await (await fetchLikeRequest(uri)).text()
  return runInThisContext(scriptString, { filename: uri, displayErrors: true })
}
/** @deprecated */ const loadLocalScript = async (filePath) => { // TODO: DEPRECATE: moved to `@dr-js/dev`
  const scriptString = await readText(filePath)
  return runInThisContext(scriptString, { filename: filePath, displayErrors: true })
}
/** @deprecated */ const loadScript = (uri) => uri.includes('://') // TODO: DEPRECATE: moved to `@dr-js/dev`
  ? loadRemoteScript(uri)
  : loadLocalScript(uri)

/** @deprecated */ const loadRemoteJSON = async (uri) => (await fetchLikeRequest(uri)).json() // TODO: DEPRECATE: moved to `@dr-js/dev`
/** @deprecated */ const loadLocalJSON = readJSON // TODO: DEPRECATE: moved to `@dr-js/dev`
/** @deprecated */ const loadJSON = (uri) => uri.includes('://') // TODO: DEPRECATE: moved to `@dr-js/dev`
  ? loadRemoteJSON(uri)
  : loadLocalJSON(uri)

/** @deprecated */ const DR_BROWSER_FILE_PATH_EXPORT = DR_BROWSER_FILE_PATH // TODO: DEPRECATE
/** @deprecated */ const DR_BROWSER_SCRIPT_TAG_EXPORT = DR_BROWSER_SCRIPT_TAG // TODO: DEPRECATE

export {
  loadRemoteScript, loadLocalScript, loadScript, // TODO: DEPRECATE: moved to `@dr-js/dev`
  loadRemoteJSON, loadLocalJSON, loadJSON, // TODO: DEPRECATE: moved to `@dr-js/dev`

  DR_BROWSER_FILE_PATH_EXPORT as DR_BROWSER_FILE_PATH, // TODO: DEPRECATE
  DR_BROWSER_SCRIPT_TAG_EXPORT as DR_BROWSER_SCRIPT_TAG // TODO: DEPRECATE
}
