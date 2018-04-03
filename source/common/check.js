// function that returns boolean

const isString = (value) => typeof (value) === 'string'
const isNumber = (value) => typeof (value) === 'number'
const isInteger = Number.isInteger

const isBasicObject = (value) => typeof (value) === 'object' && value !== null && !Array.isArray(value)
const isObjectKey = (value, key) => isBasicObject(value) && value.hasOwnProperty(key)
const isObjectContain = (value, target) => isBasicObject(value) && Object.entries(target).every(([ key, targetValue ]) => value[ key ] === targetValue)
// TODO: isObjectContainDeep

const isBasicArray = Array.isArray
const isArrayLength = (value, length) => isBasicArray(value) && value.length === length

const isBasicFunction = (value) => typeof (value) === 'function'

const isOneOf = (value, validList) => validList.includes(value)

export {
  isString,
  isNumber,
  isInteger,
  isBasicObject, isObjectKey, isObjectContain,
  isBasicArray, isArrayLength,
  isBasicFunction,
  isOneOf
}
