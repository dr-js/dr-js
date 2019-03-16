import {
  isString,
  isBoolean,
  isNumber,
  isInteger,
  isObjectAlike,
  isBasicObject, isObjectKey, isObjectContain,
  isBasicArray, isArrayLength,
  isBasicFunction,
  isPromiseAlike,
  isOneOf,
  isFunctionThrow,
  isFunctionThrowAsync,
  isStrictEqual,
  isStringifyEqual
} from './check'

import { describe } from './format'

const throwError = (title, message, detail) => { throw new Error(`[verify|${title}]${message ? ` ${message};` : ''} ${detail || ''}`) }
const createVerify = (title, checkFunc) => (value, message) => checkFunc(value) || throwError(title, message, `get: ${describe(value)}`)

const string = createVerify('String', isString)
const boolean = createVerify('Boolean', isBoolean)
const number = createVerify('Number', isNumber)
const integer = createVerify('Integer', isInteger)

const objectAlike = createVerify('ObjectAlike', isObjectAlike)

const basicObject = createVerify('BasicObject', isBasicObject)
const objectKey = (value, key, message) => isObjectKey(value, key) || throwError('ObjectKey', message, `expect to have key: ${key}`)
const objectContain = (value, target, message) => isObjectContain(value, target) || throwError('ObjectContain', message, `expect to contain: ${describe(target)}`)

const basicArray = createVerify('Array', isBasicArray)
const arrayLength = (value, length, message) => isArrayLength(value, length) || throwError('ArrayLength', message, `expect length: ${length}, get: ${isBasicArray(value) ? value.length : describe(value)}`)

const basicFunction = createVerify('Function', isBasicFunction)
const promiseAlike = createVerify('PromiseAlike', isPromiseAlike)

const oneOf = (value, validList, message) => isOneOf(value, validList) || throwError('OneOf', message, `expect one of: [${validList}], get: ${describe(value)}`)

const doThrow = (func, message) => isFunctionThrow(func) || throwError('DoThrow', message)
const doNotThrow = (func, message) => isFunctionThrow(func) && throwError('DoNotThrow', message)
const doThrowAsync = async (func, message) => (await isFunctionThrowAsync(func)) || throwError('DoThrowAsync', message)
const doNotThrowAsync = async (func, message) => (await isFunctionThrowAsync(func)) && throwError('DoThrowAsync', message)

const describeEqual = (actual, expect) => `\nactual: ${describe(actual)}\nexpect: ${describe(expect)}`

const strictEqual = (actual, expect, message) => isStrictEqual(actual, expect) || throwError('StrictEqual', message, describeEqual(actual, expect))
const notStrictEqual = (actual, expect, message) => isStrictEqual(actual, expect) && throwError('NotStrictEqual', message, describeEqual(actual, expect))

const stringifyEqual = (actual, expect, message = 'should stringify equal') => isStringifyEqual(actual, expect) || throwError('StringifyEqual', message, describeEqual(actual, expect))
const notStringifyEqual = (actual, expect, message = 'should not stringify equal') => isStringifyEqual(actual, expect) && throwError('NotStringifyEqual', message, describeEqual(actual, expect))

export {
  string,
  boolean,
  number,
  integer,
  objectAlike,
  basicObject, objectKey, objectContain,
  basicArray, arrayLength,
  basicFunction,
  promiseAlike,
  oneOf,
  doThrow, doNotThrow,
  doThrowAsync, doNotThrowAsync,
  strictEqual, notStrictEqual,
  stringifyEqual, notStringifyEqual
}
