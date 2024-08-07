import { strictEqual } from 'source/common/verify.js'
import { createStepper } from 'source/common/time.js'
import { time } from 'source/common/format.js'
import {
  B62_ZERO, B62_MAX,
  encode, decode
} from './B62.js'

const { describe, it, info = console.log } = globalThis

/** @type { [ uint: number, string: string ][] } */
const TEST_LIST = [ // [ uint, string ]
  [ 0, '0' ],
  [ 9, '9' ],
  [ 16, 'g' ],
  [ 61, 'Z' ],
  [ 65, '13' ],
  [ 99, '1B' ],
  [ 999, 'g7' ],
  [ 3843, 'ZZ' ],
  [ 9999, '2Bh' ],
  [ 238327, 'ZZZ' ],
  [ 14776335, 'ZZZZ' ],
  [ 916132831, 'ZZZZZ' ],
  [ 56800235583, 'ZZZZZZ' ],
  [ 3521614606207, 'ZZZZZZZ' ],
  [ 10000000000001, '2Q3rKTOF' ],
  [ 10000000000003, '2Q3rKTOH' ],
  [ 218340105584895, 'ZZZZZZZZ' ],
  [ Number.MAX_SAFE_INTEGER - 1, 'FfGNdXsE6' ],
  [ Number.MAX_SAFE_INTEGER, 'FfGNdXsE7' ]
]

describe('Common.Data.B62', () => {
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

    strictEqual(decode(B62_ZERO), 0)
    strictEqual(decode(B62_MAX), 62 - 1)
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
