import { describe } from './format'

const throwError = (title, message, detail) => { throw new Error(`[verify|${title}]${message ? ` ${message};` : ''} ${detail}`) }
const throwValueError = (title, message, value) => throwError(title, message, `get: ${describe(value)}`)

const string = (value, message) => typeof (value) !== 'string' && throwValueError('String', message, value)
const number = (value, message) => typeof (value) !== 'number' && throwValueError('Number', message, value)
const integer = (value, message) => !Number.isInteger(value) && throwValueError('Integer', message, value)

const basicObject = (value, message) => (typeof (value) !== 'object' || value === null || Array.isArray(value)) && throwValueError('BasicObject', message, value)
const objectKey = (value, key, message) => {
  basicObject(value, message)
  !value.hasOwnProperty(key) && throwError('ObjectKey', message, `expect to have key: ${key}`)
}

const basicArray = (value, message) => !Array.isArray(value) && throwValueError('Array', message, value)
const arrayLength = (value, length, message) => {
  basicArray(value, message)
  value.length !== length && throwError('ArrayLength', message, `expect length: ${length}, get: ${value.length}`)
}

const basicFunction = (value, message) => typeof (value) !== 'function' && throwValueError('Function', message, value)

const oneOf = (value, validList, message) => !validList.includes(value) && throwError('OneOf', message, `expect one of: [${validList}], get: ${describe(value)}`)

export {
  string,
  number,
  integer,
  basicObject, objectKey,
  basicArray, arrayLength,
  basicFunction,
  oneOf
}
