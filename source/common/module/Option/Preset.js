import { string, number, integer, arrayLength, oneOf } from 'source/common/verify'
import { arraySplitChunk } from 'source/common/data/__utils__'

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

const normalizeToString = (argumentList) => argumentList.map(String)
const normalizeToNumber = (argumentList) => argumentList.map(Number)
const normalizeToInteger = (argumentList) => argumentList.map(parseInt)

const getPreset = (argumentCount, argumentListNormalize = (v) => v, argumentListVerify = () => {}, description = '', optional = false) => ({
  argumentCount,
  argumentListNormalize,
  argumentListVerify,
  description,
  optional
})
const getOneOfPreset = (argumentListNormalize, argumentListVerify) => (selectList) => {
  argumentListVerify(selectList)
  return getPreset(1, argumentListNormalize, verifyOneOf(selectList), `one of:\n  ${arraySplitChunk(selectList, 2).map((v) => v.join(' ')).join('\n  ')}`)
}

const ConfigPreset = {
  SingleString: getPreset(1, normalizeToString, getVerifySingle(string, 'String')),
  SingleNumber: getPreset(1, normalizeToNumber, getVerifySingle(number, 'Number')),
  SingleInteger: getPreset(1, normalizeToInteger, getVerifySingle(integer, 'Integer')),

  AllString: getPreset('1+', normalizeToString, verifyAllString),
  AllNumber: getPreset('1+', normalizeToNumber, verifyAllNumber),
  AllInteger: getPreset('1+', normalizeToInteger, verifyAllInteger),

  OneOfString: getOneOfPreset(normalizeToString, verifyAllString),
  OneOfNumber: getOneOfPreset(normalizeToNumber, verifyAllNumber),
  OneOfInteger: getOneOfPreset(normalizeToInteger, verifyAllInteger),

  BooleanFlag: getPreset('0+', () => ([ true ]), undefined, 'set to enable', true),
  Any: getPreset('0+', undefined, undefined, 'optional', true)
}

ConfigPreset.Config = { // add common config preset
  ...ConfigPreset.SingleString,
  optional: true,
  name: 'config',
  shortName: 'c',
  description: `# from JSON: set to 'path/to/config.json'\n# from ENV: set to 'env'`
}

const getOptionalFormatFlag = (formatName) => (optionMap) => Boolean(optionMap[ formatName ]) // not option if the format has been set
const getOptionalFormatValue = (formatName, ...valueList) => (optionMap) => {
  const format = optionMap[ formatName ]
  return format && !valueList.includes(format.argumentList[ 0 ]) // not option if the format has been set && value match
}

export {
  ConfigPreset,
  getOptionalFormatFlag,
  getOptionalFormatValue
}
