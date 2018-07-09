import { tryRequire } from 'source/env/tryRequire'

// range [from, to] // this will not auto swap, meaning <from> should be smaller than <to>
const RANDOM_INT = (from, to) => Math.floor(Math.random() * (to - from + 1) + from)

const tryGetRandomArrayBuffer = () => {
  try { // browser
    const { crypto } = global
    const getRandomArrayBuffer = (byteLength) => {
      const arrayBuffer = new ArrayBuffer(byteLength)
      for (let index = 0; index < byteLength; index += 65536) {
        // NOTE: requested length max at 65536 bytes: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
        crypto.getRandomValues(new Uint8Array(arrayBuffer, index, Math.min(65536, byteLength - index)))
      }
      return arrayBuffer
    }
    if (getRandomArrayBuffer(32).byteLength === 32) return getRandomArrayBuffer
  } catch (error) { __DEV__ && console.log(`[tryGetRandomArrayBuffer] browser`, error) }

  try { // node
    const { randomFillSync } = tryRequire('crypto')
    const getRandomArrayBuffer = (byteLength) => {
      const dataView = new DataView(new ArrayBuffer(byteLength))
      randomFillSync(dataView)
      return dataView.buffer
    }
    if (getRandomArrayBuffer(32).byteLength === 32) return getRandomArrayBuffer
  } catch (error) { __DEV__ && console.log(`[tryGetRandomArrayBuffer] node`, error) }

  return (byteLength) => { // last fallback
    const dataView = new DataView(new ArrayBuffer(byteLength))
    for (let index = 0; index < byteLength; index++) dataView.setUint8(index, RANDOM_INT(0, 255))
    return dataView.buffer
  }
}

const getRandomInt = (a, b = 0) => RANDOM_INT(Math.min(a, b), Math.max(a, b))

// the result will be from small to big
const getRandomIntList = (a, b, count) => {
  const from = Math.min(a, b)
  const to = Math.max(a, b)
  const resultList = []
  for (let i = 0, iMax = Math.min(count, (to - from + 1)); i < iMax; i++) {
    let next = RANDOM_INT(from, to - i)
    let j = 0
    while (j < resultList.length) {
      if (resultList[ j ] > next) break
      next++
      j++
    }
    resultList.splice(j, 0, next)
  }
  return resultList
}

const getRandomId = (prefix = '') => `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

const getRandomArrayBuffer = tryGetRandomArrayBuffer()

export {
  getRandomInt,
  getRandomIntList,
  getRandomId,
  getRandomArrayBuffer
}
