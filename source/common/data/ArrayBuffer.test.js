import { strictEqual } from 'source/common/verify'
import { getSampleRange } from 'source/common/math/sample'
import {
  isEqualArrayBuffer,
  concatArrayBuffer,
  fromString,
  toString
} from './ArrayBuffer'

const { describe, it } = global

describe('Common.Data.ArrayBuffer', () => {
  // test full 16bit range, both odd and event
  const byteList0 = getSampleRange(0, 65535).reduce((o, uint16) => {
    o.push(uint16 >> 8, uint16 % 256)
    return o
  }, [])
  const byteList1 = [ 0, ...byteList0 ]

  const arrayBuffer0 = Uint8Array.from(byteList0).buffer
  const arrayBuffer1 = Uint8Array.from(byteList1).buffer

  const string0 = byteList0.map((v) => String.fromCharCode(v)).join('')
  const string1 = byteList1.map((v) => String.fromCharCode(v)).join('')

  it('isEqualArrayBuffer()', () => {
    strictEqual(isEqualArrayBuffer(new ArrayBuffer(0), new ArrayBuffer(0)), true)
    strictEqual(isEqualArrayBuffer(new ArrayBuffer(64), new ArrayBuffer(64)), true)
    strictEqual(isEqualArrayBuffer(arrayBuffer0, arrayBuffer0), true)
    strictEqual(isEqualArrayBuffer(arrayBuffer1, arrayBuffer1), true)
    strictEqual(isEqualArrayBuffer(arrayBuffer0, arrayBuffer1), false)
    strictEqual(isEqualArrayBuffer(arrayBuffer1, arrayBuffer0), false)
    strictEqual(isEqualArrayBuffer(arrayBuffer0, new ArrayBuffer(0)), false)
  })

  it('concatArrayBuffer()', () => {
    strictEqual(isEqualArrayBuffer(
      concatArrayBuffer([ arrayBuffer1, new ArrayBuffer(0), arrayBuffer1 ]),
      Uint8Array.from([ ...byteList1, ...byteList1 ]).buffer
    ), true)
    strictEqual(isEqualArrayBuffer(
      concatArrayBuffer([ arrayBuffer1, arrayBuffer0, arrayBuffer1 ]),
      Uint8Array.from([ ...byteList1, ...byteList0, ...byteList1 ]).buffer
    ), true)
  })

  it('StringArrayBuffer', () => {
    strictEqual(string0, toString(fromString(string0)))
    strictEqual(string1, toString(fromString(string1)))

    strictEqual(isEqualArrayBuffer(arrayBuffer0, fromString(toString(arrayBuffer0))), true)
    strictEqual(isEqualArrayBuffer(arrayBuffer1, fromString(toString(arrayBuffer1))), true)
  })
})
