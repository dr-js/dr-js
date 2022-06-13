import { strictEqual } from 'source/common/verify.js'
import { createStepper } from 'source/common/time.js'
import { padTable, time } from 'source/common/format.js'
import {
  cast,
  encodeF32,
  decodeF32
} from './F32.js'

const { describe, it, info = console.log } = globalThis

const TEST_LIST = [ // [ uint, string ]
  [ 0, 0, '(((((' ],
  [ 0.1, 0.10000000149011612, ':{09O' ],
  [ 1e-8, 9.99999993922529e-9, '7IF|~' ],
  [ 1e-16, 1.0000000168623835e-16, '3CD<^' ],
  [ 1e-24, 1.0000000195414814e-24, '/<]kr' ],
  [ 1e-32, 1.000000023742228e-32, '+5}C~' ],
  [ 0.12, 0.11999999731779099, ';(C4t' ],
  [ 0.12345, 0.12345000356435776, ';)+j9' ],
  [ 0.12345678, 0.12345678359270096, ';)+tl' ],
  [ 0.12345678901, 0.12345679104328156, ';)+tm' ],
  [ 0.12345678901234, 0.12345679104328156, ';)+tm' ],
  [ 1.2345678901234567, 1.2345678806304932, ';T*XB' ],
  [ 123.45678901234567, 123.456787109375, '<VCOR' ],
  [ 123456.78901234567, 123456.7890625, '>-]?+' ],
  [ 123456789.01234567, 123456792, '?Zw?z' ],
  [ 123456789012.34567, 123456790528, 'A2;Ol' ],
  [ 123456789012345.67, 123456788103168, 'B`Wm8' ],
  [ -1.2345678901234567, -1.2345678806304932, 'ck@(J' ],
  [ -123.45678901234567, -123.456787109375, 'dmXvZ' ],
  [ -123456.78901234567, -123456.7890625, 'fCrf3' ],
  [ -123456789.01234567, -123456792, 'gr5g+' ],
  [ -123456789012.34567, -123456790528, 'iHPvt' ],
  [ -123456789012345.67, -123456788103168, 'jvn<@' ]
]

describe('Common.Data.F32', () => {
  __DEV__ && it('sample output', () => {
    const table = [ [ 'value          ', 'cast', 'encodeF32', 'en-decodeF32', 'string' ] ]
    for (const [ value, , string ] of TEST_LIST) {
      table.push([ value, cast(value), encodeF32(value), decodeF32(encodeF32(value)), string ])
    }
    info(padTable({ table }))
  })

  it('cast()', () => {
    for (const [ value, expect ] of TEST_LIST) {
      strictEqual(cast(value), expect)
    }
  })

  it('encodeF32()', () => {
    for (const [ value, , string ] of TEST_LIST) {
      strictEqual(encodeF32(value), string)
    }
  })

  it('encodeF32()', () => {
    for (const [ , expect, string ] of TEST_LIST) {
      strictEqual(decodeF32(string), expect)
    }
  })

  it('stress', () => {
    const STRESS_LOOP = 9999999
    const stepper = createStepper()
    {
      let loop = STRESS_LOOP
      while (loop !== 0) {
        const [ value, , string ] = TEST_LIST[ loop % TEST_LIST.length ]
        strictEqual(encodeF32(value), string)
        loop--
      }
    }
    info('done encode', time(stepper()))
    {
      let loop = STRESS_LOOP
      while (loop !== 0) {
        const [ , expect, string ] = TEST_LIST[ loop % TEST_LIST.length ]
        strictEqual(decodeF32(string), expect)
        loop--
      }
    }
    info('done decode', time(stepper()))
  })
})
