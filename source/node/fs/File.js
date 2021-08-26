import { readFileSync, writeFileSync, appendFileSync, promises as fsAsync } from 'fs'
import { tryRequire, tryRequireResolve } from 'source/env/tryRequire.js'
import { fromNodejsBuffer } from 'source/common/data/ArrayBuffer.js'
import { dupJSON } from 'source/common/data/function.js'

const readBuffer = async (path) => fsAsync.readFile(path)
const readBufferSync = (path) => readFileSync(path)
const writeBuffer = async (path, bufferAlike) => fsAsync.writeFile(path, bufferAlike)
const writeBufferSync = (path, bufferAlike) => writeFileSync(path, bufferAlike)
const appendBuffer = async (path, bufferAlike) => fsAsync.appendFile(path, bufferAlike)
const appendBufferSync = (path, bufferAlike) => appendFileSync(path, bufferAlike)
const editBuffer = async (
  editFunc = async (buffer) => buffer,
  pathFrom,
  pathTo = pathFrom // for in-place edit
) => writeBuffer(pathTo, await editFunc(await readBuffer(pathFrom)))
const editBufferSync = (
  editFunc = (buffer) => buffer,
  pathFrom,
  pathTo = pathFrom // for in-place edit
) => writeBufferSync(pathTo, editFunc(readBufferSync(pathFrom)))

const readArrayBuffer = async (path) => fromNodejsBuffer(await readBuffer(path))
const readArrayBufferSync = (path) => fromNodejsBuffer(readBufferSync(path))
const writeArrayBuffer = writeBuffer
const writeArrayBufferSync = writeBufferSync
const appendArrayBuffer = appendBuffer
const appendArrayBufferSync = appendBufferSync
const editArrayBuffer = async (
  editFunc = async (arrayBuffer) => arrayBuffer,
  pathFrom,
  pathTo = pathFrom // for in-place edit
) => writeArrayBuffer(pathTo, await editFunc(await readArrayBuffer(pathFrom)))
const editArrayBufferSync = (
  editFunc = (arrayBuffer) => arrayBuffer,
  pathFrom,
  pathTo = pathFrom // for in-place edit
) => writeArrayBufferSync(pathTo, editFunc(readArrayBufferSync(pathFrom)))

const readText = async (path) => String(await readBuffer(path))
const readTextSync = (path) => String(readBufferSync(path))
const writeText = writeBuffer
const writeTextSync = writeBufferSync
const appendText = appendBuffer
const appendTextSync = appendBufferSync
const editText = async (
  editFunc = async (string) => string,
  pathFrom,
  pathTo = pathFrom // for in-place edit
) => writeText(pathTo, await editFunc(await readText(pathFrom)))
const editTextSync = (
  editFunc = (string) => string,
  pathFrom,
  pathTo = pathFrom // for in-place edit
) => writeTextSync(pathTo, editFunc(readTextSync(pathFrom)))

const readJSON = async (path) => JSON.parse(await readText(path))
const readJSONSync = (path) => JSON.parse(readTextSync(path))
const readJSONAlike = (path) => {
  delete require.cache[ tryRequireResolve(path) ] // clear existing cache
  return dupJSON(tryRequire(path)) // can be .js or .json, copy to prevent mutate module cache
}
const readJSONAlikeSync = readJSONAlike
const writeJSON = async (path, value) => writeBuffer(path, JSON.stringify(value))
const writeJSONSync = (path, value) => writeBufferSync(path, JSON.stringify(value))
const writeJSONPretty = async (path, value) => writeBuffer(path, JSON.stringify(value, null, 2))
const writeJSONPrettySync = (path, value) => writeBufferSync(path, JSON.stringify(value, null, 2))
const editJSON = async (
  editFunc = async (value) => value,
  pathFrom,
  pathTo = pathFrom // for in-place edit
) => writeJSON(pathTo, await editFunc(await readJSON(pathFrom)))
const editJSONSync = (
  editFunc = (value) => value,
  pathFrom,
  pathTo = pathFrom // for in-place edit
) => writeJSONSync(pathTo, editFunc(readJSONSync(pathFrom)))
const editJSONPretty = async (
  editFunc = async (value) => value,
  pathFrom,
  pathTo = pathFrom // for in-place edit
) => writeJSONPretty(pathTo, await editFunc(await readJSON(pathFrom)))
const editJSONPrettySync = (
  editFunc = (value) => value,
  pathFrom,
  pathTo = pathFrom // for in-place edit
) => writeJSONPrettySync(pathTo, editFunc(readJSONSync(pathFrom)))

export {
  readBuffer, readBufferSync, writeBuffer, writeBufferSync, appendBuffer, appendBufferSync, editBuffer, editBufferSync,
  readArrayBuffer, readArrayBufferSync, writeArrayBuffer, writeArrayBufferSync, appendArrayBuffer, appendArrayBufferSync, editArrayBuffer, editArrayBufferSync,
  readText, readTextSync, writeText, writeTextSync, appendText, appendTextSync, editText, editTextSync,
  readJSON, readJSONSync, readJSONAlike, readJSONAlikeSync, writeJSON, writeJSONSync, writeJSONPretty, writeJSONPrettySync, editJSON, editJSONSync, editJSONPretty, editJSONPrettySync
}
