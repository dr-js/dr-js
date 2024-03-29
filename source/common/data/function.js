/** @type { (a: string, b?: number) => number } */
const hashStringToNumber = (string = '', hash = 0) => {
  for (let index = 0, indexMax = string.length; index < indexMax; index++) {
    // Convert to 32bit integer and drop the sign bit (for +/-), so result range will be: [0, 2^32-1]
    hash = ((hash << 5) - hash + string.charCodeAt(index)) >>> 0
  }
  return hash
}

/** @type { (v: string) => string } */
const reverseString = (string) => [ ...string ].reverse().join('')

/** @type { (v: string) => string } */
const swapObfuscateString = (string = '') => {
  const stringLength = string.length
  const stringEndIndex = stringLength - 1
  const indexMax = Math.floor(stringLength * 0.5)
  const result = []
  if (stringLength % 2) result[ indexMax ] = string.charAt(indexMax)
  for (let index = 0; index < indexMax; index++) {
    const pickIndex = (index % 2) ? index : stringEndIndex - index
    result[ index ] = string.charAt(pickIndex)
    result[ stringEndIndex - index ] = string.charAt(stringEndIndex - pickIndex)
  }
  return result.join('')
}

/** @type { (v: vJSON) => vJSON } */
const dupJSON = (value) => JSON.parse(JSON.stringify(value))

// always return a object/array, use this with object destructuring
/** @type { (v: string, d:vJSON) => vJSON } */
const tryParseJSONObject = (text, defaultResult = {}) => {
  try {
    const result = JSON.parse(text)
    if (typeof (result) === 'object' && result !== null) return result
  } catch (error) { __DEV__ && console.log('[tryParseJSONObject] error', error) }
  return defaultResult
}

/** @type { (a: vJSON, b: string[]) => vJSON | undefined } */
const getValueByKeyList = (value, keyList) => {
  for (const key of keyList) {
    if (value && Object.prototype.hasOwnProperty.call(value, key)) value = value[ key ]
    else return
  }
  return value
}

export {
  hashStringToNumber,
  reverseString,
  swapObfuscateString,
  dupJSON,
  tryParseJSONObject,
  getValueByKeyList
}
