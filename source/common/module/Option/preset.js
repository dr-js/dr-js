import { string, number, boolean, integer, basicFunction, arrayLength, oneOf } from 'source/common/verify'
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

const ConfigPreset = Object.assign({
  BooleanFlag: getPreset('0-', undefined, () => ([ true ]), 'set to enable', true),
  Any: getPreset('0-', undefined, undefined, 'optional', true)
}, ...[
  // typeName, checkTypeFunc, normalizeToTypeFunc
  [ 'String', string, (argumentList) => argumentList.map(String) ],
  [ 'Number', number, (argumentList) => argumentList.map(Number) ],
  [ 'Boolean', boolean, (argumentList) => argumentList.map(Boolean) ],
  [ 'Integer', integer, (argumentList) => argumentList.map(parseInt) ],
  [ 'Function', basicFunction, undefined ]
].map(([ typeName, checkTypeFunc, normalizeToTypeFunc ]) => {
  const verifyAllType = getVerifyAll(checkTypeFunc, typeName)
  return {
    [ `Single${typeName}` ]: getPreset(1, getVerifySingle(checkTypeFunc, typeName), normalizeToTypeFunc),
    [ `All${typeName}` ]: getPreset('1-', verifyAllType, normalizeToTypeFunc),
    [ `OneOf${typeName}` ]: normalizeToTypeFunc && getOneOfPreset(verifyAllType, normalizeToTypeFunc)
  }
}))

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
