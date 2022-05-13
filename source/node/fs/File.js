import { readFileSync, writeFileSync, appendFileSync, copyFileSync as __copyFileSync, renameSync, unlinkSync, promises as fsAsync } from 'node:fs'
import { tryRequire, tryRequireResolve } from 'source/env/tryRequire.js'
import { fromNodejsBuffer } from 'source/common/data/ArrayBuffer.js'
import { dupJSON } from 'source/common/data/function.js'

/** @type { (v: string) => Promise<Buffer> } */
const readBuffer = async (path) => fsAsync.readFile(path)
/** @type { (v: string) => Buffer } */
const readBufferSync = (path) => readFileSync(path)
/** @type { (v: string, a: Buffer | string) => Promise<void> } */
const writeBuffer = async (path, bufferAlike) => fsAsync.writeFile(path, bufferAlike)
/** @type { (v: string, a: Buffer | string) => void } */
const writeBufferSync = (path, bufferAlike) => writeFileSync(path, bufferAlike)
/** @type { (v: string, a: Buffer | string) => Promise<void> } */
const appendBuffer = async (path, bufferAlike) => fsAsync.appendFile(path, bufferAlike)
/** @type { (v: string, a: Buffer | string) => void } */
const appendBufferSync = (path, bufferAlike) => appendFileSync(path, bufferAlike)
/** @type { (f: (v: Buffer) => Promise<Buffer | string>, a: string, b: string) => Promise<void> } */
const editBuffer = async (
  editFunc = async (buffer) => buffer,
  pathFrom,
  pathTo = pathFrom // for in-place edit
) => writeBuffer(pathTo, await editFunc(await readBuffer(pathFrom)))
/** @type { (f: (v: Buffer) => Buffer, a: string, b: string) => void } */
const editBufferSync = (
  editFunc = (buffer) => buffer,
  pathFrom,
  pathTo = pathFrom // for in-place edit
) => writeBufferSync(pathTo, editFunc(readBufferSync(pathFrom)))

/** @type { (v: string) => Promise<ArrayBuffer> } */
const readArrayBuffer = async (path) => fromNodejsBuffer(await readBuffer(path))
/** @type { (v: string) => ArrayBuffer } */
const readArrayBufferSync = (path) => fromNodejsBuffer(readBufferSync(path))
/** @type { (v: string, a: ArrayBuffer) => Promise<void> } */
const writeArrayBuffer = async (path, arrayBuffer) => writeBuffer(path, Buffer.from(arrayBuffer))
/** @type { (v: string, a: ArrayBuffer) => void } */
const writeArrayBufferSync = (path, arrayBuffer) => writeBufferSync(path, Buffer.from(arrayBuffer))
/** @type { (v: string, a: ArrayBuffer) => Promise<void> } */
const appendArrayBuffer = async (path, arrayBuffer) => appendBuffer(path, Buffer.from(arrayBuffer))
/** @type { (v: string, a: ArrayBuffer) => void } */
const appendArrayBufferSync = (path, arrayBuffer) => appendBufferSync(path, Buffer.from(arrayBuffer))
/** @type { (f: (v: ArrayBuffer) => Promise<ArrayBuffer>, a: string, b: string) => Promise<void> } */
const editArrayBuffer = async (
  editFunc = async (arrayBuffer) => arrayBuffer,
  pathFrom,
  pathTo = pathFrom // for in-place edit
) => writeArrayBuffer(pathTo, await editFunc(await readArrayBuffer(pathFrom)))
/** @type { (f: (v: ArrayBuffer) => ArrayBuffer, a: string, b: string) => void } */
const editArrayBufferSync = (
  editFunc = (arrayBuffer) => arrayBuffer,
  pathFrom,
  pathTo = pathFrom // for in-place edit
) => writeArrayBufferSync(pathTo, editFunc(readArrayBufferSync(pathFrom)))

/** @type { (v: string) => Promise<string> } */
const readText = async (path) => String(await readBuffer(path))
/** @type { (v: string) => string } */
const readTextSync = (path) => String(readBufferSync(path))
/** @type { (v: string, a: string) => Promise<void> } */
const writeText = writeBuffer
/** @type { (v: string, a: string) => void } */
const writeTextSync = writeBufferSync
/** @type { (v: string, a: string) => Promise<void> } */
const appendText = appendBuffer
/** @type { (v: string, a: string) => void } */
const appendTextSync = appendBufferSync
/** @type { (f: (v: string) => Promise<string>, a: string, b: string) => Promise<void> } */
const editText = async (
  editFunc = async (string) => string,
  pathFrom,
  pathTo = pathFrom // for in-place edit
) => writeText(pathTo, await editFunc(await readText(pathFrom)))
/** @type { (f: (v: string) => string, a: string, b: string) => void } */
const editTextSync = (
  editFunc = (string) => string,
  pathFrom,
  pathTo = pathFrom // for in-place edit
) => writeTextSync(pathTo, editFunc(readTextSync(pathFrom)))

/** @type { (v: string) => Promise<vJSON> } */
const readJSON = async (path) => JSON.parse(await readText(path))
/** @type { (v: string) => vJSON } */
const readJSONSync = (path) => JSON.parse(readTextSync(path))
/** @type { (v: string) => Promise<vJSON> } */
const readJSONAlike = (path) => { // TODO: better consider this `async`
  delete require.cache[ tryRequireResolve(path) ] // clear existing cache
  return dupJSON(tryRequire(path)) // can be .js or .json, copy to prevent mutate module cache
}
/** @type { (v: string) => vJSON } */
const readJSONAlikeSync = readJSONAlike
/** @type { (v: string, a: vJSON) => Promise<void> } */
const writeJSON = async (path, value) => writeBuffer(path, JSON.stringify(value))
/** @type { (v: string, a: vJSON) => void } */
const writeJSONSync = (path, value) => writeBufferSync(path, JSON.stringify(value))
/** @type { (v: string, a: vJSON) => Promise<void> } */
const writeJSONPretty = async (path, value) => writeBuffer(path, JSON.stringify(value, null, 2))
/** @type { (v: string, a: vJSON) => void } */
const writeJSONPrettySync = (path, value) => writeBufferSync(path, JSON.stringify(value, null, 2))
/** @type { (f: (v: vJSON) => Promise<vJSON>, a: string, b: string) => Promise<void> } */
const editJSON = async (
  editFunc = async (value) => value,
  pathFrom,
  pathTo = pathFrom // for in-place edit
) => writeJSON(pathTo, await editFunc(await readJSON(pathFrom)))
/** @type { (f: (v: vJSON) => vJSON, a: string, b: string) => void } */
const editJSONSync = (
  editFunc = (value) => value,
  pathFrom,
  pathTo = pathFrom // for in-place edit
) => writeJSONSync(pathTo, editFunc(readJSONSync(pathFrom)))
/** @type { (f: (v: vJSON) => Promise<vJSON>, a: string, b: string) => Promise<void> } */
const editJSONPretty = async (
  editFunc = async (value) => value,
  pathFrom,
  pathTo = pathFrom // for in-place edit
) => writeJSONPretty(pathTo, await editFunc(await readJSON(pathFrom)))
/** @type { (f: (v: vJSON) => vJSON, a: string, b: string) => void } */
const editJSONPrettySync = (
  editFunc = (value) => value,
  pathFrom,
  pathTo = pathFrom // for in-place edit
) => writeJSONPrettySync(pathTo, editFunc(readJSONSync(pathFrom)))

/** @type { (a: string, b: string) => Promise<void> } */
const copyFile = async (pathFrom, pathTo) => fsAsync.copyFile(pathFrom, pathTo) // resolve to nothing
/** @type { (a: string, b: string) => void } */
const copyFileSync = (pathFrom, pathTo) => __copyFileSync(pathFrom, pathTo)
/** @type { (a: string, b: string) => Promise<void> } */
const renameFile = async (pathFrom, pathTo) => fsAsync.rename(pathFrom, pathTo) // resolve to nothing
/** @type { (a: string, b: string) => void } */
const renameFileSync = (pathFrom, pathTo) => renameSync(pathFrom, pathTo)
/** @type { (v: string) => Promise<void> } */
const deleteFile = async (path) => fsAsync.unlink(path) // resolve to nothing
/** @type { (v: string) => void } */
const deleteFileSync = (path) => unlinkSync(path)
/** @type { (v: string) => Promise<void> } */
const deleteFileForce = async (path) => { try { await deleteFile(path) } catch (error) { __DEV__ && console.log('[deleteFileForce]', path, error) } } // resolve to nothing
/** @type { (v: string) => void } */
const deleteFileForceSync = (path) => { try { deleteFileSync(path) } catch (error) { __DEV__ && console.log('[deleteFileForceSync]', path, error) } }

export {
  readBuffer, readBufferSync, writeBuffer, writeBufferSync, appendBuffer, appendBufferSync, editBuffer, editBufferSync,
  readArrayBuffer, readArrayBufferSync, writeArrayBuffer, writeArrayBufferSync, appendArrayBuffer, appendArrayBufferSync, editArrayBuffer, editArrayBufferSync,
  readText, readTextSync, writeText, writeTextSync, appendText, appendTextSync, editText, editTextSync,
  readJSON, readJSONSync, readJSONAlike, readJSONAlikeSync, writeJSON, writeJSONSync, writeJSONPretty, writeJSONPrettySync, editJSON, editJSONSync, editJSONPretty, editJSONPrettySync,

  copyFile, copyFileSync,
  renameFile, renameFileSync,
  deleteFile, deleteFileSync, deleteFileForce, deleteFileForceSync
}
