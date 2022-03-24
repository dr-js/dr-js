import {
  isString,
  isBoolean, isTruthy,
  isNumber,
  isInteger,
  isRegExp,
  isArrayBuffer,
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
} from './check.js'

import { describe } from './format.js'

const __throw = (title, message, detail) => { throw new Error(`[verify|${title}]${message ? ` ${message};` : ''} ${detail || ''}`) }

/** @typedef { (value: *, message?: string) => void } VerifyFunc */
/** @type { (title: string, checkFunc: ((value: *) => boolean)) => VerifyFunc } */
const __toVerify = (title, checkFunc) => (value, message) => { checkFunc(value) || __throw(title, message, `get: ${describe(value)}`) }

const string = __toVerify('String', isString)
const boolean = __toVerify('Boolean', isBoolean)
const truthy = __toVerify('Truthy', isTruthy)
const number = __toVerify('Number', isNumber)
const integer = __toVerify('Integer', isInteger)
const regexp = __toVerify('RegExp', isRegExp)
const arrayBuffer = __toVerify('ArrayBuffer', isArrayBuffer)

const objectAlike = __toVerify('ObjectAlike', isObjectAlike)

const basicObject = __toVerify('BasicObject', isBasicObject)
/** @type { (value: *, key: string, message?: string) => void } */
const objectKey = (value, key, message) => { isObjectKey(value, key) || __throw('ObjectKey', message, `expect to have key: ${key}`) }
/** @type { (value: *, target: *, message?: string) => void } */
const objectContain = (value, target, message) => { isObjectContain(value, target) || __throw('ObjectContain', message, `expect to contain: ${describe(target)}`) }

const basicArray = __toVerify('Array', isBasicArray)
/** @type { (value: *, length: number, message?: string) => void } */
const arrayLength = (value, length, message) => { isArrayLength(value, length) || __throw('ArrayLength', message, `expect length: ${length}, get: ${isBasicArray(value) ? value.length : describe(value)}`) }

const basicFunction = __toVerify('Function', isBasicFunction)
const promiseAlike = __toVerify('PromiseAlike', isPromiseAlike)

/** @type { (value: *, validList: Array, message?: string) => void } */
const oneOf = (value, validList, message) => { isOneOf(value, validList) || __throw('OneOf', message, `expect one of: [${validList}], get: ${describe(value)}`) }

/** @type { (func: Function, message?: string) => void } */
const doThrow = (func, message) => { isFunctionThrow(func) || __throw('DoThrow', message) }
/** @type { (func: Function, message?: string) => void } */
const doNotThrow = (func, message) => { isFunctionThrow(func) && __throw('DoNotThrow', message) }

/** @type { (func: Function, message?: string) => Promise<void> } */
const doThrowAsync = async (func, message) => { (await isFunctionThrowAsync(func)) || __throw('DoThrowAsync', message) }
/** @type { (func: Function, message?: string) => Promise<void> } */
const doNotThrowAsync = async (func, message) => { (await isFunctionThrowAsync(func)) && __throw('DoNotThrowAsync', message) }
// const doThrowAsync = (func, message) => isFunctionThrowAsync(func).then((isThrow) => !isThrow && __throw('DoThrowAsync', message)) // NOTE: reference async-less implementation
// const doNotThrowAsync = (func, message) => isFunctionThrowAsync(func).then((isThrow) => isThrow && __throw('DoNotThrowAsync', message)) // NOTE: reference async-less implementation

const __detailEqual = (actual, expect) => `\nactual: ${describe(actual)}\nexpect: ${describe(expect)}`

/** @typedef { (actual: *, expect: *, message?: string) => void } VerifyCompareFunc */

/** @type { VerifyCompareFunc } */
const strictEqual = (actual, expect, message) => { isStrictEqual(actual, expect) || __throw('StrictEqual', message, __detailEqual(actual, expect)) }
/** @type { VerifyCompareFunc } */
const notStrictEqual = (actual, expect, message) => { isStrictEqual(actual, expect) && __throw('NotStrictEqual', message, __detailEqual(actual, expect)) }

/** @type { VerifyCompareFunc } */
const stringifyEqual = (actual, expect, message = 'should stringify equal') => { isStringifyEqual(actual, expect) || __throw('StringifyEqual', message, __detailEqual(actual, expect)) }
/** @type { VerifyCompareFunc } */
const notStringifyEqual = (actual, expect, message = 'should not stringify equal') => { isStringifyEqual(actual, expect) && __throw('NotStringifyEqual', message, __detailEqual(actual, expect)) }

// for string/array/typedArray
/** @type { VerifyCompareFunc } */
const includes = (actual, expect, message) => { (actual && actual.includes && actual.includes(expect)) || __throw('Includes', message, `expect ${describe(actual)} to include ${expect}`) }
/** @type { VerifyCompareFunc } */
const notIncludes = (actual, expect, message) => { (actual && actual.includes && !actual.includes(expect)) || __throw('NotIncludes', message, `expect ${describe(actual)} to not include ${expect}`) }

export {
  string,
  boolean, truthy,
  number,
  integer,
  regexp,
  arrayBuffer,
  objectAlike,
  basicObject, objectKey, objectContain,
  basicArray, arrayLength,
  basicFunction,
  promiseAlike,
  oneOf,
  doThrow, doNotThrow,
  doThrowAsync, doNotThrowAsync,
  strictEqual, notStrictEqual,
  stringifyEqual, notStringifyEqual,
  includes, notIncludes
}
