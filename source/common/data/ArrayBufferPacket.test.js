import { equal } from 'assert'
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
    equal(
      packArrayBufferPacket(headerString).byteLength,
      HEADER_BYTE_SIZE + headerArrayBuffer.byteLength
    )
    equal(
      packArrayBufferPacket(headerString, payloadArrayBuffer).byteLength,
      HEADER_BYTE_SIZE + headerArrayBuffer.byteLength + payloadArrayBuffer.byteLength
    )
  })

  it('parseArrayBufferPacket()', () => {
    {
      const [ parsedHeaderString, parsedPayload ] = parseArrayBufferPacket(packArrayBufferPacket(headerString))
      equal(headerString, parsedHeaderString)
      equal(isEqualArrayBuffer(new ArrayBuffer(0), parsedPayload), true)
    }

    {
      const [ parsedHeaderString, parsedPayload ] = parseArrayBufferPacket(packArrayBufferPacket(headerString, payloadArrayBuffer))
      equal(headerString, parsedHeaderString)
      equal(isEqualArrayBuffer(payloadArrayBuffer, parsedPayload), true)
    }
  })

  it('ChainArrayBufferPacket', () => {
    const chainArrayBufferPacket = packChainArrayBufferPacket(arrayBufferList)
    const parsedArrayBufferList = parseChainArrayBufferPacket(chainArrayBufferPacket)
    arrayBufferList.forEach((arrayBuffer, index) => equal(
      isEqualArrayBuffer(arrayBuffer, parsedArrayBufferList[ index ]),
      true,
      `check equal arrayBufferList[${index}]`
    ))
  })
})
