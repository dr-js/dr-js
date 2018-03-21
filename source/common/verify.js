import {
  isString,
  isNumber,
  isInteger,
  isBasicObject, isObjectKey, isObjectContain,
  isBasicArray, isArrayLength,
  isBasicFunction,
  isOneOf
} from './check'

import { describe } from './format'

const throwError = (title, message, detail) => { throw new Error(`[verify|${title}]${message ? ` ${message};` : ''} ${detail}`) }
const createVerify = (title, checkFunc) => (value, message) => checkFunc(value) || throwError(title, message, `get: ${describe(value)}`)

const string = createVerify('String', isString)
const number = createVerify('Number', isNumber)
const integer = createVerify('Integer', isInteger)

const basicObject = createVerify('BasicObject', isBasicObject)
const objectKey = (value, key, message) => isObjectKey(value, key) || throwError('ObjectKey', message, `expect to have key: ${key}`)
const objectContain = (value, target, message) => isObjectContain(value, target) || throwError('ObjectContain', message, `expect to contain: ${describe(target)}`)

const basicArray = createVerify('Array', isBasicArray)
const arrayLength = (value, length, message) => isArrayLength(value, length) || throwError('ArrayLength', message, `expect length: ${length}, get: ${value.length}`)

const basicFunction = createVerify('Function', isBasicFunction)

const oneOf = (value, validList, message) => isOneOf(value, validList) || throwError('OneOf', message, `expect one of: [${validList}], get: ${describe(value)}`)

export {
  string,
  number,
  integer,
  basicObject, objectKey, objectContain,
  basicArray, arrayLength,
  basicFunction,
  oneOf
}
