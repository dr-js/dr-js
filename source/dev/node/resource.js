import { runInThisContext } from 'node:vm'
import { readText, readJSON } from 'source/node/fs/File.js'
import { fetchLikeRequest } from 'source/node/net.js'

// TODO: check if is needed, or simplify
const loadRemoteScript = async (uri) => {
  const scriptString = await (await fetchLikeRequest(uri)).text()
  return runInThisContext(scriptString, { filename: uri, displayErrors: true })
}
const loadLocalScript = async (filePath) => {
  const scriptString = await readText(filePath)
  return runInThisContext(scriptString, { filename: filePath, displayErrors: true })
}
const loadScript = (uri) => uri.includes('://')
  ? loadRemoteScript(uri)
  : loadLocalScript(uri)

const loadRemoteJSON = async (uri) => (await fetchLikeRequest(uri)).json()
const loadLocalJSON = readJSON
const loadJSON = (uri) => uri.includes('://')
  ? loadRemoteJSON(uri)
  : loadLocalJSON(uri)

export {
  loadRemoteScript, loadLocalScript, loadScript,
  loadRemoteJSON, loadLocalJSON, loadJSON
}
