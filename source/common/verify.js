import { describe } from './format'

const verifyError = (title, message, value) => new Error(`[verify|${title}]${message ? ` ${message};` : ''} get: ${describe(value)}`)

const string = (value, message) => {
  if (typeof (value) !== 'string') throw verifyError('String', message, value)
}
const number = (value, message) => {
  if (typeof (value) !== 'number') throw verifyError('Number', message, value)
}
const integer = (value, message) => {
  if (!Number.isInteger(value)) throw verifyError('Integer', message, value)
}

const basicObject = (value, message) => {
  if (typeof (value) !== 'object' || value === null || Array.isArray(value)) throw verifyError('BasicObject', message, value)
}
const objectKey = (value, key, message) => {
  basicObject(value, message)
  if (!value.hasOwnProperty(key)) throw new Error(`[verify|ObjectKey]${message ? ` ${message};` : ''} expect to have key: ${key}`)
}

const basicArray = (value, message) => {
  if (!Array.isArray(value)) throw verifyError('Array', message, value)
}
const arrayLength = (value, length, message) => {
  basicArray(value, message)
  if (value.length !== length) throw new Error(`[verify|ArrayLength]${message ? ` ${message};` : ''} expect length: ${length}, get: ${value.length}`)
}

const basicFunction = (value, message) => {
  if (typeof (value) !== 'function') throw verifyError('Function', message, value)
}

const oneOf = (value, validList, message) => {
  if (!validList.includes(value)) throw new Error(`[verify|oneOf]${message ? ` ${message};` : ''} expect one of: [${validList}], get: ${describe(value)}`)
}

export {
  string,
  number,
  integer,
  basicObject,
  objectKey,
  basicArray,
  arrayLength,
  basicFunction,

  oneOf
}
