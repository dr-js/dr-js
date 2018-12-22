import { runInThisContext } from 'vm'
import { fetchLikeRequest } from 'source/node/net'
import { readFileAsync } from 'source/node/file/function'

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
  loadRemoteScript, loadLocalScript, loadScript,
  loadRemoteJSON, loadLocalJSON, loadJSON
}
