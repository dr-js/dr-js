// function that returns boolean

/** @type { (value: unknown) => value is string } */
const isString = (value) => typeof (value) === 'string'
/** @type { (value: unknown) => value is boolean } */
const isBoolean = (value) => typeof (value) === 'boolean'
/** @type { (value: unknown) => boolean } */
const isTruthy = (value) => Boolean(value)
/** @type { (value: unknown) => value is number } */
const isNumber = (value) => typeof (value) === 'number'
/** @type { (value: unknown) => value is number } */
const isInteger = /** @type { (value: unknown) => value is number } */ (/** @type { unknown } */ Number.isInteger)
/** @type { (value: unknown) => value is RegExp } */
const isRegExp = (value) => value instanceof RegExp
/** @type { (value: unknown) => value is ArrayBuffer } */
const isArrayBuffer = (value) => value instanceof ArrayBuffer

/** @type { (value: unknown) => value is Object } */
const isObjectAlike = (value) => { // can have key/value: object/array/function
  const type = typeof (value)
  return (type === 'object' && value !== null) || (type === 'function')
}

/** @typedef { Object & { [Symbol.iterator]?: never } & { [Symbol.hasInstance]?: never } } BasicObject */
/** @type { (value: unknown) => value is BasicObject } */
const isBasicObject = (value) => typeof (value) === 'object' && value !== null && !Array.isArray(value) // NOTE: not confuse with the idea Array is a special Object
/** @type { (value: unknown, key: string) => value is BasicObject } */
const isObjectKey = (value, key) => isBasicObject(value) && Object.prototype.hasOwnProperty.call(value, key)
/** @type { (value: unknown, target: Record<string, unknown>) => value is BasicObject } */
const isObjectContain = (value, target) => isBasicObject(value) && Object.entries(target).every(([ key, targetValue ]) => value[ key ] === targetValue)

/** @type { (value: unknown) => value is Array } */
const isBasicArray = Array.isArray
/** @type { (value: unknown, length: number) => value is Array } */
const isArrayLength = (value, length) => isBasicArray(value) && value.length === length

/** @type { (value: unknown) => value is Function } */
const isBasicFunction = (value) => typeof (value) === 'function'

/** @type { (value: unknown) => value is Promise } */
const isPromiseAlike = (value) => Boolean(value && typeof ((/** @type { Promise } */ (/** @type { unknown } */ value)).then) === 'function')

/** @type { (value: unknown, validList: unknown[]) => boolean } */
const isOneOf = (value, validList) => validList.includes(value)

/** @type { (func: Function) => boolean } */
const isFunctionThrow = (func) => {
  try {
    return func() && false
  } catch (error) { return true }
}

/** @type { (func: Function) => Promise<boolean> } */
const isFunctionThrowAsync = async (func) => {
  try {
    return (await func()) && false
  } catch (error) { return true }
}
// const isFunctionThrowAsync = (func) => { // NOTE: reference async-less implementation
//   try {
//     return Promise.resolve(func()).then(funcNotThrow, funcDoThrow)
//   } catch (error) { return Promise.resolve(true) }
// }
// const funcNotThrow = () => false
// const funcDoThrow = () => true

/** @type { <T> (actual: unknown, expect: T) => actual is T } */
const isStrictEqual = (actual, expect) => Object.is(actual, expect) // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
/** @type { <T> (actual: unknown, expect: T) => actual is T } */
const isStringifyEqual = (actual, expect) => {
  if (Object.is(actual, expect)) return true
  if (isObjectAlike(actual) && isObjectAlike(expect)) return JSON.stringify(actual) === JSON.stringify(expect)
  else return false
}

export {
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
}
