import { strictEqual } from 'source/common/verify.js'
import { fromNodejsBuffer } from 'source/common/data/ArrayBuffer.js'
import { packArrayBufferPacket } from 'source/common/data/ArrayBufferPacket.js'
import { packBufferPacket, parseBufferPacket } from './BufferPacket.js'

const { describe, it } = globalThis

describe('Node.Data.BufferPacket', () => {
  const headerString = 'headerString'
  const payloadBuffer = Buffer.from('payloadBuffer')

  it('packBufferPacket()', () => {
    const packet = packBufferPacket(headerString, payloadBuffer)
    strictEqual(packet.length, packArrayBufferPacket(headerString, fromNodejsBuffer(payloadBuffer)).byteLength)
  })

  it('parseBufferPacket()', () => {
    const packet = packBufferPacket(headerString, payloadBuffer)
    const [ parsedHeaderString, parsedPayloadBuffer ] = parseBufferPacket(packet)
    strictEqual(headerString, parsedHeaderString)
    strictEqual(Buffer.compare(payloadBuffer, parsedPayloadBuffer), 0)
  })
})
