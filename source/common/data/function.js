const hashStringToNumber = (string = '', hash = 0) => {
  for (let index = 0, indexMax = string.length; index < indexMax; index++) {
    // Convert to 32bit integer and drop the sign bit (for +/-), so result range will be: [0, 2^32-1]
    hash = ((hash << 5) - hash + string.charCodeAt(index)) >>> 0
  }
  return hash
}

// always return a object/array, use this with object destructuring
const tryParseJSONObject = (text, defaultResult = {}) => {
  try {
    const result = JSON.parse(text)
    if (typeof (result) === 'object' && result !== null) return result
  } catch (error) { __DEV__ && console.log('[tryParseJSONObject] error', error) }
  return defaultResult
}

const getValueByKeyList = (value, keyList) => {
  for (const key of keyList) {
    if (value && typeof (value) === 'object' && value.hasOwnProperty(key)) value = value[ key ]
    else return
  }
  return value
}

export {
  hashStringToNumber,
  tryParseJSONObject,
  getValueByKeyList
}
