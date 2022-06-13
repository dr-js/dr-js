// B62: base62 encode/decode for Uint (range [0, Number.MAX_SAFE_INTEGER], no float, no negative)
//   good for persisting uint value like: timestamp, size, id, index
//   bad for case-insensitive string transports
//   initial code borrowed from: https://github.com/base62/base62.js/blob/v2.0.1/lib/ascii.js

// NOTE: the "a-zA-Z" order is reversed in charCode ("A-Za-z")
const __CHAR_LIST = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

const B62_ZERO = __CHAR_LIST[ 0 ]

/** @type { (uint: number) => string } */
const encode = (uint) => {
  if (uint === 0) return B62_ZERO
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
    const digit = (charCode < 58) ? charCode - 48 // 0-9
      : (charCode < 91) ? charCode - 29 // A-Z
        : charCode - 87 // a-z
    uint += digit * __POW62_LIST[ length - i - 1 ] // uint += digit * Math.pow(62, length - i - 1)
  }
  return uint
}

export {
  B62_ZERO,
  encode,
  decode
}
