import { runInNewContext } from 'vm'
import { fetch } from 'source/node/net'
import { readFileAsync } from 'source/node/file/function'

// TODO: check if is needed, or simplify
const loadRemoteScript = async (src, contextObject) => {
  const response = await fetch(src)
  return runInNewContext(await response.text(), contextObject, { filename: src })
}
const loadLocalScript = async (path, contextObject) => runInNewContext(
  await readFileAsync(path, 'utf8'),
  contextObject,
  { filename: path }
)
const loadScript = (src, contextObject) => src.includes('://')
  ? loadRemoteScript(src, contextObject)
  : loadLocalScript(src, contextObject)

const loadRemoteJSON = async (src) => {
  const response = await fetch(src)
  return response.json()
}
const loadLocalJSON = async (path) => JSON.parse(await readFileAsync(path, 'utf8'))
const loadJSON = (src) => src.includes('://')
  ? loadRemoteJSON(src)
  : loadLocalJSON(src)

export {
  loadRemoteScript, loadLocalScript, loadScript,
  loadRemoteJSON, loadLocalJSON, loadJSON
}
