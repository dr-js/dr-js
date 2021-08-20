import { strictEqual, truthy } from 'source/common/verify.js'
import { time } from 'source/common/format.js'
import { createStepper } from 'source/common/time.js'
import { getSampleRange, getSample } from 'source/common/math/sample.js'
import { encode } from './Base64.js'
import {
  isEqualArrayBuffer,
  concatArrayBuffer,
  fromU16String, toU16String,
  calcSHA256ArrayBuffer
} from './ArrayBuffer.js'

const { describe, it, info = console.log } = globalThis

describe('Common.Data.ArrayBuffer', () => {
  // test full 16bit range, both odd and even
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
    truthy(isEqualArrayBuffer(new ArrayBuffer(0), new ArrayBuffer(0)))
    truthy(isEqualArrayBuffer(new ArrayBuffer(64), new ArrayBuffer(64)))
    truthy(isEqualArrayBuffer(arrayBuffer0, arrayBuffer0))
    truthy(isEqualArrayBuffer(arrayBuffer1, arrayBuffer1))
    truthy(!isEqualArrayBuffer(arrayBuffer0, arrayBuffer1))
    truthy(!isEqualArrayBuffer(arrayBuffer1, arrayBuffer0))
    truthy(!isEqualArrayBuffer(arrayBuffer0, new ArrayBuffer(0)))
  })

  it('concatArrayBuffer()', () => {
    truthy(isEqualArrayBuffer(
      concatArrayBuffer([ arrayBuffer1, new ArrayBuffer(0), arrayBuffer1 ]),
      Uint8Array.from([ ...byteList1, ...byteList1 ]).buffer
    ))
    truthy(isEqualArrayBuffer(
      concatArrayBuffer([ arrayBuffer1, arrayBuffer0, arrayBuffer1 ]),
      Uint8Array.from([ ...byteList1, ...byteList0, ...byteList1 ]).buffer
    ))
  })

  it('fromU16String(),toU16String()', () => {
    strictEqual(string0, toU16String(fromU16String(string0)))
    strictEqual(string1, toU16String(fromU16String(string1)))

    truthy(isEqualArrayBuffer(arrayBuffer0, fromU16String(toU16String(arrayBuffer0))))
    truthy(isEqualArrayBuffer(arrayBuffer1, fromU16String(toU16String(arrayBuffer1))))
  })
  it('[stress] fromU16String(),toU16String()', () => {
    const stepper = createStepper()
    const arrayBufferBig = concatArrayBuffer(getSample(() => arrayBuffer0, 1024)) // 1024 * 65536 = 64MiB
    info('done build data', time(stepper()))
    const string = toU16String(arrayBufferBig)
    info('toU16String data', time(stepper()))
    const arrayBufferOutput = fromU16String(string)
    info('fromU16String data', time(stepper()))
    truthy(isEqualArrayBuffer(arrayBufferOutput, arrayBufferBig))
  })

  it('calcSHA256ArrayBuffer()', async () => {
    strictEqual(encode(await calcSHA256ArrayBuffer(new ArrayBuffer(0))), '47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=')
    strictEqual(encode(await calcSHA256ArrayBuffer(new ArrayBuffer(8))), 'r1Vw9aGBC3r3jK9LxwpmDw31HkK6+R1N5bIyjeDoPfw=')
    strictEqual(encode(await calcSHA256ArrayBuffer(new ArrayBuffer(64))), '9aX9QtFqIDAnmO9u0wmXm0MAPSMg2fDo6pgxqSdZ+0s=')
  })
})
