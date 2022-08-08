// B86: base86 encode/decode for Uint (range [0, Number.MAX_SAFE_INTEGER], no float, no negative)
//   extended from base62, use more printable char but less readable
//   5-digit-base86 can fit one Uint32
//   no quote ('") and whitespace (\w) char to be somewhat inline-safe
//   fixed-length base86 is directly sortable (by ASCII) without decode to Uint

// NOTE: check with: Object.fromEntries(' '.repeat(128).split('').map((v, i) => [ `x${i.toString(16).padStart(2, '0')}`, String.fromCharCode(i) ]))
// const ASCII_MAP = {
//   x00: '\0', x01: '\x01', x02: '\x02', x03: '\x03', x04: '\x04', x05: '\x05', x06: '\x06', x07: '\x07',
//   x08: '\b', x09: '\t', x0a: '\n', x0b: '\v', x0c: '\f', x0d: '\r',
//   x0e: '\x0e', x0f: '\x0f', x10: '\x10', x11: '\x11', x12: '\x12', x13: '\x13', x14: '\x14', x15: '\x15', x16: '\x16', x17: '\x17', x18: '\x18', x19: '\x19', x1a: '\x1a', x1b: '\x1b', x1c: '\x1c', x1d: '\x1d', x1e: '\x1e', x1f: '\x1f',
//   x20: ' ',
//   x21: '!',
//   x22: '"',
//   x23: '#', x24: '$', x25: '%', x26: '&',
//   x27: '\'',
//   x28: '(', x29: ')', x2a: '*', x2b: '+', x2c: ',', x2d: '-', x2e: '.', x2f: '/',
//   x30: '0', x31: '1', x32: '2', x33: '3', x34: '4', x35: '5', x36: '6', x37: '7', x38: '8', x39: '9',
//   x3a: ':', x3b: ';', x3c: '<', x3d: '=', x3e: '>', x3f: '?', x40: '@',
//   x41: 'A', x42: 'B', x43: 'C', x44: 'D', x45: 'E', x46: 'F', x47: 'G', x48: 'H', x49: 'I', x4a: 'J', x4b: 'K', x4c: 'L', x4d: 'M', x4e: 'N', x4f: 'O', x50: 'P', x51: 'Q', x52: 'R', x53: 'S', x54: 'T', x55: 'U', x56: 'V', x57: 'W', x58: 'X', x59: 'Y', x5a: 'Z',
//   x5b: '[',
//   x5c: '\\',
//   x5d: ']', x5e: '^', x5f: '_', x60: '`',
//   x61: 'a', x62: 'b', x63: 'c', x64: 'd', x65: 'e', x66: 'f', x67: 'g', x68: 'h', x69: 'i', x6a: 'j', x6b: 'k', x6c: 'l', x6d: 'm', x6e: 'n', x6f: 'o', x70: 'p', x71: 'q', x72: 'r', x73: 's', x74: 't', x75: 'u', x76: 'v', x77: 'w', x78: 'x', x79: 'y', x7a: 'z',
//   x7b: '{', x7c: '|', x7d: '}', x7e: '~',
//   x7f: ''
// }

const __CHAR_LIST = (
  '()*+,-./' + // x28-x2f
  '0123456789' + // x30-x39
  ':;<=>?@' + // x3a-x40
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + // x41-x5a
  '[' + // x5b
  // skip x5c: '\\'
  ']^_`' + // x5d-x60
  'abcdefghijklmnopqrstuvwxyz' + // x61-x7a
  '{|}~' // x7b-x7e
).split('')

const B86_ZERO = '(' // __CHAR_LIST[ 0 ]
const B86_MAX = '~' // __CHAR_LIST[ __CHAR_LIST.length -1 ]

/** @type { (uint: number) => string } */
const encode = (uint) => {
  if (uint === 0) return B86_ZERO
  let string = ''
  while (uint > 0) {
    string = __CHAR_LIST[ uint % 86 ] + string
    uint = Math.floor(uint / 86)
  }
  return string
}

// NOTE: pre-calc up to `86 ** 8`
//   2992179271065856 // 86 ** 8
//   9007199254740991 // Number.MAX_SAFE_INTEGER
//   257327417311663600 // 86 ** 9
const __POW86_LIST = [ 1, 86, 7396, 636056, 54700816, 4704270176, 404567235136, 34792782221696, 2992179271065856 ] // '012345678'.split('').map((v) => 86 ** parseInt(v))

/** @type { (uintString: string) => number } */
const decode = (uintString) => {
  let uint = 0
  const length = uintString.length
  for (let i = 0; i < length; i++) {
    const charCode = uintString.charCodeAt(i)
    const digit = (charCode <= 0x5b) ? charCode - 0x28 // x28-x5b
      : charCode - 0x28 - 1 // x5d-x7e
    uint += digit * __POW86_LIST[ length - i - 1 ] // uint += digit * (86 ** (length - i - 1))
  }
  return uint
}

export {
  B86_ZERO, B86_MAX,
  encode, decode
}
