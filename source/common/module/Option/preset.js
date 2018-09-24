import { string, number, integer, basicFunction, arrayLength, oneOf } from 'source/common/verify'
import { arraySplitChunk } from 'source/common/immutable/Array'

const verifySingleArray = (argumentList) => arrayLength(argumentList, 1, 'single argument expected')
const verifyOneOf = (selectList) => (argumentList) => {
  verifySingleArray(argumentList)
  oneOf(argumentList[ 0 ], selectList)
}

const getVerifySingle = (typeVerify, typeName) => (argumentList) => {
  verifySingleArray(argumentList)
  typeVerify(argumentList[ 0 ], `single ${typeName} argument expected`)
}
const getVerifyAll = (typeVerify, typeName) => (argumentList) => { argumentList.forEach((v, i) => typeVerify(v, `${typeName} expected at #${i}`)) }

const verifyAllString = getVerifyAll(string, 'String')
const verifyAllNumber = getVerifyAll(number, 'Number')
const verifyAllInteger = getVerifyAll(integer, 'Integer')
const verifyAllFunction = getVerifyAll(basicFunction, 'Function')

const normalizeToString = (argumentList) => argumentList.map(String)
const normalizeToNumber = (argumentList) => argumentList.map(Number)
const normalizeToInteger = (argumentList) => argumentList.map(parseInt)

const getPreset = (argumentCount, argumentListVerify = () => {}, argumentListNormalize = (v) => v, description = '', optional = false) => ({
  argumentCount,
  argumentListNormalize,
  argumentListVerify,
  description,
  optional
})
const getOneOfPreset = (argumentListVerify, argumentListNormalize) => (selectList) => {
  argumentListVerify(selectList)
  return getPreset(1, verifyOneOf(selectList), argumentListNormalize, `one of:\n  ${arraySplitChunk(selectList, 4).map((v) => v.join(' ')).join('\n  ')}`)
}

const ConfigPreset = {
  SingleString: getPreset(1, getVerifySingle(string, 'String'), normalizeToString),
  SingleNumber: getPreset(1, getVerifySingle(number, 'Number'), normalizeToNumber),
  SingleInteger: getPreset(1, getVerifySingle(integer, 'Integer'), normalizeToInteger),
  SingleFunction: getPreset(1, getVerifySingle(basicFunction, 'Function'), undefined),

  AllString: getPreset('1-', verifyAllString, normalizeToString),
  AllNumber: getPreset('1-', verifyAllNumber, normalizeToNumber),
  AllInteger: getPreset('1-', verifyAllInteger, normalizeToInteger),
  AllFunction: getPreset('1-', verifyAllFunction, undefined),

  OneOfString: getOneOfPreset(normalizeToString, verifyAllString),
  OneOfNumber: getOneOfPreset(normalizeToNumber, verifyAllNumber),
  OneOfInteger: getOneOfPreset(normalizeToInteger, verifyAllInteger),

  BooleanFlag: getPreset('0-', undefined, () => ([ true ]), 'set to enable', true),
  Any: getPreset('0-', undefined, undefined, 'optional', true)
}

const getOptionalFormatFlag = (...formatNameList) => (optionMap) => !formatNameList.some((formatName) => Boolean(optionMap[ formatName ])) // not option if the format has been set
const getOptionalFormatValue = (formatName, ...valueList) => (optionMap) => {
  const format = optionMap[ formatName ]
  return format && !valueList.includes(format.argumentList[ 0 ]) // not option if the format has been set && value match
}

export {
  ConfigPreset,
  getOptionalFormatFlag,
  getOptionalFormatValue
}
