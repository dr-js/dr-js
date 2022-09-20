// B62S: ASCII sortable base62
//   use "0-9A-Za-z" instead of "0-9a-zA-Z"
//   do not mix encode/decode with common B62

const __CHAR_LIST = (
  '0123456789' +
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
  'abcdefghijklmnopqrstuvwxyz'
).split('')

const B62S_ZERO = '0' // __CHAR_LIST[ 0 ]
const B62S_MAX = 'z' // __CHAR_LIST[ __CHAR_LIST.length - 1 ]

/** @type { (uint: number) => string } */
const encode = (uint) => {
  if (uint === 0) return B62S_ZERO
  let string = ''
  while (uint > 0) {
    string = __CHAR_LIST[ uint % 62 ] + string
    uint = Math.floor(uint / 62)
  }
  return string
}

// NOTE: pre-calc up to `62 ** 8`
//   218340105584896 // Math.pow(62, 8)
//   9007199254740991 // Number.MAX_SAFE_INTEGER
//   13537086546263552 // Math.pow(62, 9)
const __POW62_LIST = [ 1, 62, 3844, 238328, 14776336, 916132832, 56800235584, 3521614606208, 218340105584896 ] // '012345678'.split('').map((v) => Math.pow(62, parseInt(v)))

/** @type { (uintString: string) => number } */
const decode = (uintString) => {
  let uint = 0
  const length = uintString.length
  for (let i = 0; i < length; i++) {
    const charCode = uintString.charCodeAt(i)
    const digit = (charCode <= 0x39) ? charCode - 0x30 // 0-9 -> [0,9] // '0':0x30, '9':0x39
      : (charCode <= 0x5a) ? charCode - 0x41 + 10 // A-Z -> [10,35] // 'A':0x41, 'Z':0x5a
        : charCode - 0x61 + 36 // a-z -> [36,61] // 'a':0x61, 'z':0x7a
    uint += digit * __POW62_LIST[ length - i - 1 ] // uint += digit * Math.pow(62, length - i - 1)
  }
  return uint
}

export {
  B62S_ZERO, B62S_MAX,
  encode, decode
}
