import { strictEqual } from 'source/common/verify.js'
import { createStepper } from 'source/common/time.js'
import { time } from 'source/common/format.js'
import { encode, decode } from './B62.js'

const { describe, it, info = console.log } = globalThis

const TEST_LIST = [ // [ uint, string ]
  [ 0, '0' ],
  [ 16, 'g' ],
  [ 61, 'Z' ],
  [ 65, '13' ],
  [ 999, 'g7' ],
  [ 9999, '2Bh' ],
  [ 238327, 'ZZZ' ],
  [ 10000000000001, '2Q3rKTOF' ],
  [ 10000000000003, '2Q3rKTOH' ],
  [ Number.MAX_SAFE_INTEGER - 1, 'FfGNdXsE6' ],
  [ Number.MAX_SAFE_INTEGER, 'FfGNdXsE7' ]
]

describe('Common.Data.B62', () => {
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
      [ 65, '0013' ] // should ignore leading zeros
    ]) strictEqual(decode(string), uint)
  })

  it('stress', () => {
    const STRESS_LOOP = 999999
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
