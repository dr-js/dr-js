import { strictEqual } from 'source/common/verify.js'
import { isEqualArrayBuffer, fromU16String } from './ArrayBuffer.js'
import {
  HEADER_BYTE_SIZE,
  packArrayBufferPacket,
  parseArrayBufferPacket,
  packChainArrayBufferPacket,
  parseChainArrayBufferPacket
} from './ArrayBufferPacket.js'

const { describe, it } = globalThis

describe('Common.Data.ArrayBufferPacket', () => {
  const headerString = 'header-array-buffer'
  const payloadString = 'payload-array-buffer'
  const headerArrayBuffer = fromU16String(headerString)
  const payloadArrayBuffer = fromU16String(payloadString)
  const arrayBufferList = [
    fromU16String('0'),
    fromU16String('1'),
    fromU16String('AAA'),
    fromU16String('BBB')
  ]

  it('packArrayBufferPacket()', () => {
    strictEqual(
      packArrayBufferPacket(headerString).byteLength,
      HEADER_BYTE_SIZE + headerArrayBuffer.byteLength
    )
    strictEqual(
      packArrayBufferPacket(headerString, payloadArrayBuffer).byteLength,
      HEADER_BYTE_SIZE + headerArrayBuffer.byteLength + payloadArrayBuffer.byteLength
    )
  })

  it('parseArrayBufferPacket()', () => {
    {
      const [ headerU16String, parsedPayload ] = parseArrayBufferPacket(packArrayBufferPacket(headerString))
      strictEqual(headerString, headerU16String)
      strictEqual(isEqualArrayBuffer(new ArrayBuffer(0), parsedPayload), true)
    }

    {
      const [ headerU16String, parsedPayload ] = parseArrayBufferPacket(packArrayBufferPacket(headerString, payloadArrayBuffer))
      strictEqual(headerString, headerU16String)
      strictEqual(isEqualArrayBuffer(payloadArrayBuffer, parsedPayload), true)
    }
  })

  it('ChainArrayBufferPacket', () => {
    const chainArrayBufferPacket = packChainArrayBufferPacket(arrayBufferList)
    const parsedArrayBufferList = parseChainArrayBufferPacket(chainArrayBufferPacket)
    arrayBufferList.forEach((arrayBuffer, index) => strictEqual(
      isEqualArrayBuffer(arrayBuffer, parsedArrayBufferList[ index ]),
      true,
      `check strictEqual arrayBufferList[${index}]`
    ))
  })
})
