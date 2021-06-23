import { strictEqual } from 'source/common/verify.js'
import { packArrayBufferPacket } from 'source/common/data/ArrayBufferPacket.js'
import { toArrayBuffer } from './Buffer.js'
import { packBufferPacket, parseBufferPacket } from './BufferPacket.js'

const { describe, it } = global

describe('Node.Data.BufferPacket', () => {
  const headerString = 'headerString'
  const payloadBuffer = Buffer.from('payloadBuffer')

  it('packBufferPacket()', () => {
    const packet = packBufferPacket(headerString, payloadBuffer)
    strictEqual(packet.length, packArrayBufferPacket(headerString, toArrayBuffer(payloadBuffer)).byteLength)
  })

  it('parseBufferPacket()', () => {
    const packet = packBufferPacket(headerString, payloadBuffer)
    const [ parsedHeaderString, parsedPayloadBuffer ] = parseBufferPacket(packet)
    strictEqual(headerString, parsedHeaderString)
    strictEqual(Buffer.compare(payloadBuffer, parsedPayloadBuffer), 0)
  })
})
