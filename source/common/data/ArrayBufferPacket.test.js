import { strictEqual } from 'source/common/verify'
import { isEqualArrayBuffer, fromString } from './ArrayBuffer'
import {
  HEADER_BYTE_SIZE,
  packArrayBufferPacket,
  parseArrayBufferPacket,
  packChainArrayBufferPacket,
  parseChainArrayBufferPacket
} from './ArrayBufferPacket'

const { describe, it } = global

describe('Common.Data.ArrayBufferPacket', () => {
  const headerString = 'header-array-buffer'
  const payloadString = 'payload-array-buffer'
  const headerArrayBuffer = fromString(headerString)
  const payloadArrayBuffer = fromString(payloadString)
  const arrayBufferList = [
    fromString('0'),
    fromString('1'),
    fromString('AAA'),
    fromString('BBB')
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
      const [ parsedHeaderString, parsedPayload ] = parseArrayBufferPacket(packArrayBufferPacket(headerString))
      strictEqual(headerString, parsedHeaderString)
      strictEqual(isEqualArrayBuffer(new ArrayBuffer(0), parsedPayload), true)
    }

    {
      const [ parsedHeaderString, parsedPayload ] = parseArrayBufferPacket(packArrayBufferPacket(headerString, payloadArrayBuffer))
      strictEqual(headerString, parsedHeaderString)
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
