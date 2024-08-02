import { strictEqual } from 'source/common/verify.js'
import { createStepper } from 'source/common/time.js'
import { time } from 'source/common/format.js'
import {
  B62S_ZERO, B62S_MAX,
  encode, decode
} from './B62S.js'

const { describe, it, info = console.log } = globalThis

/** @type { [ uint: number, string: string ][] } */
const TEST_LIST = [ // [ uint, string ]
  [ 0, '0' ],
  [ 9, '9' ],
  [ 16, 'G' ],
  [ 61, 'z' ],
  [ 65, '13' ],
  [ 99, '1b' ],
  [ 999, 'G7' ],
  [ 3843, 'zz' ],
  [ 9999, '2bH' ],
  [ 238327, 'zzz' ],
  [ 14776335, 'zzzz' ],
  [ 916132831, 'zzzzz' ],
  [ 56800235583, 'zzzzzz' ],
  [ 3521614606207, 'zzzzzzz' ],
  [ 10000000000001, '2q3Rktof' ],
  [ 10000000000003, '2q3Rktoh' ],
  [ 218340105584895, 'zzzzzzzz' ],
  [ Number.MAX_SAFE_INTEGER - 1, 'fFgnDxSe6' ],
  [ Number.MAX_SAFE_INTEGER, 'fFgnDxSe7' ]
]

describe('Common.Data.B62S', () => {
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
      [ 65, '0013' ] // should ignore leading zeros
    ]
    for (const [ uint, string ] of testList) strictEqual(decode(string), uint)

    strictEqual(decode(B62S_ZERO), 0)
    strictEqual(decode(B62S_MAX), 62 - 1)
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
