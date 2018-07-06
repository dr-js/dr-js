const isEqualArrayBuffer = (a, b) => {
  if (a === b) return true
  if (a.byteLength !== b.byteLength) return false
  const va = new Uint8Array(a)
  const vb = new Uint8Array(b)
  for (let index = 0, indexMax = a.byteLength; index < indexMax; index++) {
    if (va[ index ] !== vb[ index ]) return false
  }
  return true
}

const concatArrayBuffer = (arrayBufferList = []) => {
  const resultTypedArray = new Uint8Array(arrayBufferList.reduce((o, arrayBuffer) => o + arrayBuffer.byteLength, 0))
  let byteOffset = 0
  arrayBufferList.forEach((arrayBuffer) => {
    const { byteLength } = arrayBuffer
    resultTypedArray.set(new Uint8Array(arrayBuffer), byteOffset)
    byteOffset += byteLength
  })
  return resultTypedArray.buffer
}

const decatArrayBuffer = (concatedArrayBuffer, byteLengthList, byteOffset = 0) => byteLengthList.map((byteLength) => {
  const arrayBuffer = concatedArrayBuffer.slice(byteOffset, byteOffset + byteLength)
  byteOffset += byteLength
  return arrayBuffer
})

// NOTE: string is considered as Uint16ArrayBuffer
// string to arrayBuffer will use more space (in string unicode encode use 8bit instead of 16bit for char like [a-z])
// but invalid UTF-16 char does not get changed (like 57236 -> 65533 in TextEncoder/TextDecoder/Buffer.toString)
const PREFIX_ODD = Uint8Array.of(0x00)
const PREFIX_EVEN = Uint8Array.of(0xff, 0xff)
const toString = (arrayBuffer) => {
  const packArrayBuffer = concatArrayBuffer([
    arrayBuffer.byteLength % 2 ? PREFIX_ODD : PREFIX_EVEN,
    arrayBuffer
  ])
  const dataView = new DataView(packArrayBuffer)
  const charCodeList = []
  for (let index = 0, indexMax = dataView.byteLength / 2; index < indexMax; index++) {
    charCodeList.push(String.fromCharCode(dataView.getUint16(index * 2, false)))
  }
  return charCodeList.join('')
}

const fromString = (string = '') => {
  const dataView = new DataView(new ArrayBuffer(string.length * 2))
  for (let index = 0, indexMax = string.length; index < indexMax; index++) {
    dataView.setUint16(index * 2, string.charCodeAt(index), false)
  }
  return dataView.buffer.slice(dataView.getUint8(0) === 0x00
    ? PREFIX_ODD.byteLength
    : PREFIX_EVEN.byteLength
  )
}

export {
  isEqualArrayBuffer,
  concatArrayBuffer,
  decatArrayBuffer,
  fromString,
  toString
}
