import { string, number, integer, arrayLength, oneOf } from 'source/common/verify'

const verifySingleArray = (argumentList) => arrayLength(argumentList, 1, 'single argument expected')
const verifySingleString = (argumentList) => {
  verifySingleArray(argumentList)
  string(argumentList[ 0 ], 'single String argument expected')
}
const verifySingleNumber = (argumentList) => {
  verifySingleArray(argumentList)
  number(argumentList[ 0 ], 'single Number argument expected')
}
const verifySingleInteger = (argumentList) => {
  verifySingleArray(argumentList)
  integer(argumentList[ 0 ], 'single Integer argument expected')
}
const verifyAllString = (argumentList) => { argumentList.forEach((v, i) => string(v, `String expected at #${i}`)) }
const verifyAllNumber = (argumentList) => { argumentList.forEach((v, i) => number(v, `Number expected at #${i}`)) }
const verifyAllInteger = (argumentList) => { argumentList.forEach((v, i) => integer(v, `Integer expected at #${i}`)) }
const verifyOneOf = (selectList) => (argumentList) => {
  verifySingleArray(argumentList)
  oneOf(argumentList[ 0 ], selectList)
}

const normalizeToString = (argumentList) => argumentList.map(String)
const normalizeToNumber = (argumentList) => argumentList.map(Number)
const normalizeToInteger = (argumentList) => argumentList.map(parseInt)

const descriptionOneOf = (selectList) => `one of:\n  ${selectList.join(', ')}`

const getPreset = (argumentCount, argumentListNormalize, argumentListVerify, description) => ({ argumentCount, argumentListNormalize, argumentListVerify, description })

const OPTION_CONFIG_PRESET = {
  SingleString: getPreset(1, normalizeToString, verifySingleString),
  SingleNumber: getPreset(1, normalizeToNumber, verifySingleNumber),
  SingleInteger: getPreset(1, normalizeToInteger, verifySingleInteger),
  AllString: getPreset('1+', normalizeToString, verifyAllString),
  AllNumber: getPreset('1+', normalizeToNumber, verifyAllNumber),
  AllInteger: getPreset('1+', normalizeToInteger, verifyAllInteger),
  OneOfString: (selectList) => {
    verifyAllString(selectList)
    return getPreset(1, normalizeToString, verifyOneOf(selectList), descriptionOneOf(selectList))
  },
  OneOfNumber: (selectList) => {
    verifyAllNumber(selectList)
    return getPreset(1, normalizeToNumber, verifyOneOf(selectList), descriptionOneOf(selectList))
  },
  OneOfInteger: (selectList) => {
    verifyAllInteger(selectList)
    return getPreset(1, normalizeToInteger, verifyOneOf(selectList), descriptionOneOf(selectList))
  }
}

export { OPTION_CONFIG_PRESET }
