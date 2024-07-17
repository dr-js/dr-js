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

/** @type { (title: string, message?: string, detail?: string) => never } */
const __throw = (title, message, detail) => { throw new Error(`[verify|${title}]${message ? ` ${message};` : ''} ${detail || ''}`) }

/** @type { (title: string, checkFunc: (value: unknown) => boolean) => (value: unknown, message?: string) => void } */
const __toVerify = (title, checkFunc) => (value, message) => { checkFunc(value) || __throw(title, message, `get: ${describe(value)}`) }

/** @type { (value: unknown, message?: string) => asserts value is string } */
const string = __toVerify('String', isString)
/** @type { (value: unknown, message?: string) => asserts value is boolean } */
const boolean = __toVerify('Boolean', isBoolean)
/** @type { (value: unknown, message?: string) => void } */
const truthy = __toVerify('Truthy', isTruthy)
/** @type { (value: unknown, message?: string) => asserts value is number } */
const number = __toVerify('Number', isNumber)
/** @type { (value: unknown, message?: string) => asserts value is number } */
const integer = __toVerify('Integer', isInteger)
/** @type { (value: unknown, message?: string) => asserts value is RegExp } */
const regexp = __toVerify('RegExp', isRegExp)
/** @type { (value: unknown, message?: string) => asserts value is ArrayBuffer } */
const arrayBuffer = __toVerify('ArrayBuffer', isArrayBuffer)

/** @type { (value: unknown, message?: string) => asserts value is Object } */
const objectAlike = __toVerify('ObjectAlike', isObjectAlike)

/** @import { BasicObject } from './check' */
/** @type { (value: unknown, message?: string) => asserts value is BasicObject } */
const basicObject = __toVerify('BasicObject', isBasicObject)
/** @type { (value: unknown, key: string, message?: string) => asserts value is BasicObject } */
const objectKey = (value, key, message) => { isObjectKey(value, key) || __throw('ObjectKey', message, `expect to have key: ${key}`) }
/** @type { (value: unknown, target: Record<string, unknown>, message?: string) => asserts value is BasicObject } */
const objectContain = (value, target, message) => { isObjectContain(value, target) || __throw('ObjectContain', message, `expect to contain: ${describe(target)}`) }

/** @type { (value: unknown, message?: string) => asserts value is Array } */
const basicArray = __toVerify('Array', isBasicArray)
/** @type { (value: unknown, length: number, message?: string) => asserts value is Array } */
const arrayLength = (value, length, message) => { isArrayLength(value, length) || __throw('ArrayLength', message, `expect length: ${length}, get: ${isBasicArray(value) ? value.length : describe(value)}`) }

/** @type { (value: unknown, message?: string) => asserts value is Function } */
const basicFunction = __toVerify('Function', isBasicFunction)
/** @type { (value: unknown, message?: string) => asserts value is Promise } */
const promiseAlike = __toVerify('PromiseAlike', isPromiseAlike)

/** @type { (value: unknown, validList: unknown[], message?: string) => void } */
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

/** @type { (actual: unknown, expect: unknown) => string } */
const __detailEqual = (actual, expect) => `\nactual: ${describe(actual)}\nexpect: ${describe(expect)}`

/** @typedef { <T> (actual: unknown, expect: T, message?: string) => asserts actual is T } VerifyEqualFunc */

/** @type { VerifyEqualFunc } */
const strictEqual = (actual, expect, message) => { isStrictEqual(actual, expect) || __throw('StrictEqual', message, __detailEqual(actual, expect)) }
/** @type { VerifyEqualFunc } */
const notStrictEqual = (actual, expect, message) => { isStrictEqual(actual, expect) && __throw('NotStrictEqual', message, __detailEqual(actual, expect)) }

/** @type { VerifyEqualFunc } */
const stringifyEqual = (actual, expect, message = 'should stringify equal') => { isStringifyEqual(actual, expect) || __throw('StringifyEqual', message, __detailEqual(actual, expect)) }
/** @type { VerifyEqualFunc } */
const notStringifyEqual = (actual, expect, message = 'should not stringify equal') => { isStringifyEqual(actual, expect) && __throw('NotStringifyEqual', message, __detailEqual(actual, expect)) }

/** @typedef {
 ((actual: string, expect: string, message?: string) => void) |
 (<T> (actual: T[], expect: T, message?: string) => void)
 } VerifyIncludeFunc */

// for string/array/typedArray
/** @type { VerifyIncludeFunc } */
const includes = (actual, expect, message) => { (actual && actual.includes && actual.includes(expect)) || __throw('Includes', message, `expect ${describe(actual)} to include ${expect}`) }
/** @type { VerifyIncludeFunc } */
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
