import { strictEqual } from 'source/common/verify.js'
import { createStepper } from 'source/common/time.js'
import { time } from 'source/common/format.js'
import { withRepeat } from 'source/common/function.js'
import {
  B86_ZERO, B86_MAX,
  encode, decode
} from './B86.js'

const { describe, it, info = console.log } = globalThis

/** @type { [ uint: number, string: string ][] } */
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
    /** @type { [ uint: number, string: string ][] } */
    const testList = [
      ...TEST_LIST,
      [ 5.5, 'undefined' ], // should not loop with float
      [ -2, '' ] // should not loop with negative
    ]
    for (const [ uint, string ] of testList) strictEqual(encode(uint), string)
  })

  it('decode()', () => {
    /** @type { [ uint: number, string: string ][] } */
    const testList = [
      ...TEST_LIST,
      [ 65, `${B86_ZERO}${B86_ZERO}${B86_ZERO}j` ] // should ignore leading zeros
    ]
    for (const [ uint, string ] of testList) strictEqual(decode(string), uint)

    strictEqual(decode(B86_ZERO), 0)
    strictEqual(decode(B86_MAX), 86 - 1)
  })

  it('stress', () => {
    const STRESS_LOOP = __DEV__ ? 9999999 : 999999
    /** @type { [ uint: number, stringB86: string, stringB36: string ][] } */
    const STRESS_TEST_LIST = TEST_LIST.map(([ v ]) => [ v, encode(v), v.toString(36) ])
    const stepper = createStepper()

    withRepeat(() => {
      {
        let loop = STRESS_LOOP
        while (loop !== 0) {
          const [ uint, stringB86 ] = STRESS_TEST_LIST[ loop % STRESS_TEST_LIST.length ]
          strictEqual(encode(uint), stringB86)
          loop--
        }
      }
      info('done encode', time(stepper()))
      {
        let loop = STRESS_LOOP
        while (loop !== 0) {
          const [ uint, stringB86 ] = STRESS_TEST_LIST[ loop % STRESS_TEST_LIST.length ]
          strictEqual(decode(stringB86), uint)
          loop--
        }
      }
      info('done decode', time(stepper()))

      {
        let loop = STRESS_LOOP
        while (loop !== 0) {
          const [ uint, , stringB36 ] = STRESS_TEST_LIST[ loop % STRESS_TEST_LIST.length ]
          strictEqual(uint.toString(36), stringB36)
          loop--
        }
      }
      info('done encode B36', time(stepper()))
      {
        let loop = STRESS_LOOP
        while (loop !== 0) {
          const [ uint, , stringB36 ] = STRESS_TEST_LIST[ loop % STRESS_TEST_LIST.length ]
          strictEqual(parseInt(stringB36, 36), uint)
          loop--
        }
      }
      info('done decode B36', time(stepper()))
    }, 2)
  })
})
