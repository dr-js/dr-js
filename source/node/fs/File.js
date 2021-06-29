import { promises as fsAsync } from 'fs'
import { toArrayBuffer } from 'source/node/data/Buffer.js'

const readBuffer = async (path) => fsAsync.readFile(path)
const writeBuffer = async (path, bufferAlike) => fsAsync.writeFile(path, bufferAlike)
const appendBuffer = async (path, bufferAlike) => fsAsync.appendFile(path, bufferAlike)
const editBuffer = async (
  editFunc = async (buffer) => buffer,
  pathFrom,
  pathTo = pathFrom // for in-place edit
) => writeBuffer(pathTo, await editFunc(await readBuffer(pathFrom)))

const readArrayBuffer = async (path) => toArrayBuffer(await readBuffer(path))
const writeArrayBuffer = async (path, arrayBuffer) => writeBuffer
const appendArrayBuffer = async (path, arrayBuffer) => appendBuffer
const editArrayBuffer = async (
  editFunc = async (arrayBuffer) => arrayBuffer,
  pathFrom,
  pathTo = pathFrom // for in-place edit
) => writeArrayBuffer(pathTo, await editFunc(await readArrayBuffer(pathFrom)))

const readText = async (path) => String(await readBuffer(path))
const writeText = writeBuffer
const appendText = appendBuffer
const editText = async (
  editFunc = async (string) => string,
  pathFrom,
  pathTo = pathFrom // for in-place edit
) => writeText(pathTo, await editFunc(await readText(pathFrom)))

const readJSON = async (path) => JSON.parse(await readText(path))
const writeJSON = async (path, value) => writeBuffer(path, JSON.stringify(value))
const writeJSONPretty = async (path, value) => writeBuffer(path, JSON.stringify(value, null, 2))
const editJSON = async (
  editFunc = async (value) => value,
  pathFrom,
  pathTo = pathFrom // for in-place edit
) => writeJSON(pathTo, await editFunc(await readJSON(pathFrom)))
const editJSONPretty = async (
  editFunc = async (value) => value,
  pathFrom,
  pathTo = pathFrom // for in-place edit
) => writeJSONPretty(pathTo, await editFunc(await readJSON(pathFrom)))

export {
  readBuffer, writeBuffer, appendBuffer, editBuffer,
  readArrayBuffer, writeArrayBuffer, appendArrayBuffer, editArrayBuffer,
  readText, writeText, appendText, editText,
  readJSON, writeJSON, writeJSONPretty, editJSON, editJSONPretty
}
