import { strictEqual } from 'source/common/verify.js'
import { createStepper } from 'source/common/time.js'
import { padTable, time } from 'source/common/format.js'
import {
  cast,
  encodeF32, decodeF32,
  encodeF32W, decodeF32W
} from './F32.js'

const { describe, it, info = console.log } = globalThis

const TEST_LIST = [ // [ float, float32, f32, f32w ]
  [ 0, 0, '(((((', '000000' ],
  [ 0.1, 0.10000000149011612, ':{09O', '18ARLx' ],
  [ 1e-8, 9.99999993922529e-9, '7IF|~', '0uxojX' ],
  [ 1e-16, 1.0000000168623835e-16, '3CD<^', '0ftdwL' ],
  [ 1e-24, 1.0000000195414814e-24, '/<]kr', '0Qne9l' ],
  [ 1e-32, 1.000000023742228e-32, '+5}C~', '0BhrrT' ],
  [ 0.12, 0.11999999731779099, ';(C4t', '18Lhfz' ],
  [ 0.12345, 0.12345000356435776, ';)+j9', '18Ne8Z' ],
  [ 0.12345678, 0.12345678359270096, ';)+tl', '18NeNF' ],
  [ 0.12345678901, 0.12345679104328156, ';)+tm', '18NeNG' ],
  [ 0.12345678901234, 0.12345679104328156, ';)+tm', '18NeNG' ],
  [ 1.2345678901234567, 1.2345678806304932, ';T*XB', '1AEMvS' ],
  [ 123.45678901234567, 123.456787109375, '<VCOR', '1E1zwe' ],
  [ 123456.78901234567, 123456.7890625, '>-]?+', '1JgNsr' ],
  [ 123456789.01234567, 123456792, '?Zw?z', '1PKo8R' ],
  [ 123456789012.34567, 123456790528, 'A2;Ol', '1UzGe1' ],
  [ 123456789012345.67, 123456788103168, 'B`Wm8', '1adlMK' ],
  [ -1.2345678901234567, -1.2345678806304932, 'ck@(J', '3VYzWU' ],
  [ -123.45678901234567, -123.456787109375, 'dmXvZ', '3ZMcXg' ],
  [ -123456.78901234567, -123456.7890625, 'fCrf3', '3f10Tt' ],
  [ -123456789.01234567, -123456792, 'gr5g+', '3kfQjT' ],
  [ -123456789012.34567, -123456790528, 'iHPvt', '3qJtF3' ],
  [ -123456789012345.67, -123456788103168, 'jvn<@', '3vyNxM' ]
]

describe('Common.Data.F32', () => {
  __DEV__ && it('sample output', () => {
    const table = [ [ 'value          ', 'cast', 'F32', 'encodeF32', 'en-decodeF32', 'F32W', 'encodeF32W', 'en-decodeF32W' ] ]
    for (const [ value, , f32, f32w ] of TEST_LIST) {
      table.push([ value, cast(value), f32, encodeF32(value), decodeF32(encodeF32(value)), f32w, encodeF32W(value), decodeF32W(encodeF32W(value)) ])
    }
    info(padTable({ table }))
  })

  it('cast()', () => {
    for (const [ value, expect ] of TEST_LIST) {
      strictEqual(cast(value), expect)
    }
  })

  it('encodeF32()', () => {
    for (const [ value, , f32 ] of TEST_LIST) {
      strictEqual(encodeF32(value), f32)
    }
  })

  it('decodeF32()', () => {
    for (const [ , expect, f32 ] of TEST_LIST) {
      strictEqual(decodeF32(f32), expect)
    }
  })

  it('encodeF32W()', () => {
    for (const [ value, , , f32w ] of TEST_LIST) {
      strictEqual(encodeF32W(value), f32w)
    }
  })

  it('decodeF32W()', () => {
    for (const [ , expect, , f32w ] of TEST_LIST) {
      strictEqual(decodeF32W(f32w), expect)
    }
  })

  it('stress', () => {
    const STRESS_LOOP = 9999999
    const stepper = createStepper()
    {
      let loop = STRESS_LOOP
      while (loop !== 0) {
        const [ value, , f32 ] = TEST_LIST[ loop % TEST_LIST.length ]
        strictEqual(encodeF32(value), f32)
        loop--
      }
    }
    info('done encode F32', time(stepper()))
    {
      let loop = STRESS_LOOP
      while (loop !== 0) {
        const [ , expect, f32 ] = TEST_LIST[ loop % TEST_LIST.length ]
        strictEqual(decodeF32(f32), expect)
        loop--
      }
    }
    info('done decode F32', time(stepper()))
    {
      let loop = STRESS_LOOP
      while (loop !== 0) {
        const [ value, , , f32w ] = TEST_LIST[ loop % TEST_LIST.length ]
        strictEqual(encodeF32W(value), f32w)
        loop--
      }
    }
    info('done encode F32W', time(stepper()))
    {
      let loop = STRESS_LOOP
      while (loop !== 0) {
        const [ , expect, , f32w ] = TEST_LIST[ loop % TEST_LIST.length ]
        strictEqual(decodeF32W(f32w), expect)
        loop--
      }
    }
    info('done decode F32W', time(stepper()))
  })
})
