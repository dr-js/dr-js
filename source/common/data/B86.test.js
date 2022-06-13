import { strictEqual } from 'source/common/verify.js'
import { createStepper } from 'source/common/time.js'
import { time } from 'source/common/format.js'
import { B86_ZERO, encode, decode } from './B86.js'

const { describe, it, info = console.log } = globalThis

const TEST_LIST = [ // [ uint, string ]
  [ 0, '(' ],
  [ 9, '1' ],
  [ 16, '8' ],
  [ 61, 'f' ],
  [ 65, 'j' ],
  [ 85, '~' ],
  [ 86, ')(' ],
  [ 99, ')5' ],
  [ 999, '3^' ],
  [ 3843, 'Td' ],
  [ 9999, ')F?' ],
  [ 238327, 'H;=' ],
  [ 14776335, '?;tr' ],
  [ 916132831, '8iDdE' ],
  [ 4294967296, 'wTRu8' ], // 2**32
  [ 56800235583, '4.Hcl^' ],
  [ 3521614606207, '0e[XHix' ],
  [ 10000000000001, '@fg_2[O' ],
  [ 10000000000003, '@fg_2[Q' ],
  [ 218340105584895, '.?d6t]nb' ],
  [ 2992179271065856, ')((((((((' ],
  [ Number.MAX_SAFE_INTEGER - 1, '+(tllt;zm' ],
  [ Number.MAX_SAFE_INTEGER, '+(tllt;zn' ]
]

describe('Common.Data.B86', () => {
  it('encode()', () => {
    for (const [ uint, string ] of [
      ...TEST_LIST,
      [ 5.5, 'undefined' ], // should not loop with float
      [ -2, '' ] // should not loop with negative
    ]) strictEqual(encode(uint), string)
  })

  it('decode()', () => {
    for (const [ uint, string ] of [
      ...TEST_LIST,
      [ 65, `${B86_ZERO}${B86_ZERO}${B86_ZERO}j` ] // should ignore leading zeros
    ]) strictEqual(decode(string), uint)
  })

  it('stress', () => {
    const STRESS_LOOP = 9999999
    const stepper = createStepper()
    {
      let loop = STRESS_LOOP
      while (loop !== 0) {
        const [ uint, string ] = TEST_LIST[ loop % TEST_LIST.length ]
        strictEqual(encode(uint), string)
        loop--
      }
    }
    info('done encode', time(stepper()))
    {
      let loop = STRESS_LOOP
      while (loop !== 0) {
        const [ uint, string ] = TEST_LIST[ loop % TEST_LIST.length ]
        strictEqual(decode(string), uint)
        loop--
      }
    }
    info('done decode', time(stepper()))
  })
})
