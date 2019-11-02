// function that returns boolean

const isString = (value) => typeof (value) === 'string'
const isBoolean = (value) => typeof (value) === 'boolean'
const isNumber = (value) => typeof (value) === 'number'
const isInteger = Number.isInteger

const isObjectAlike = (value) => { // can have key/value: object/array/function
  const type = typeof (value)
  return (type === 'object' && value !== null) || (type === 'function')
}

const isBasicObject = (value) => typeof (value) === 'object' && value !== null && !Array.isArray(value)
const isObjectKey = (value, key) => isBasicObject(value) && Object.prototype.hasOwnProperty.call(value, key)
const isObjectContain = (value, target) => isBasicObject(value) && Object.entries(target).every(([ key, targetValue ]) => value[ key ] === targetValue)

const isBasicArray = Array.isArray
const isArrayLength = (value, length) => isBasicArray(value) && value.length === length

const isBasicFunction = (value) => typeof (value) === 'function'

const isPromiseAlike = (value) => Boolean(value && typeof (value.then) === 'function')

const isOneOf = (value, validList) => validList.includes(value)

const isFunctionThrow = (func) => {
  try {
    return func() && false
  } catch (error) { return true }
}

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

const isStrictEqual = (value, target) => Object.is(value, target)
const isStringifyEqual = (value, target) => {
  if (Object.is(value, target)) return true
  if (isObjectAlike(value) && isObjectAlike(target)) return JSON.stringify(value) === JSON.stringify(target)
  else return false
}

export {
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
}
