const hashStringToNumber = (string = '', hash = 0) => {
  for (let index = 0, indexMax = string.length; index < indexMax; index++) hash = ((hash << 5) - hash + string.charCodeAt(index)) >>> 0 // Convert to 32bit integer and drop the sign bit (for +/-), so result range will be: [0, 2^32-1]
  return hash
}

export {
  hashStringToNumber
}
