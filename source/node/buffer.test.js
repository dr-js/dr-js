import { equal } from 'assert'
import { packBufferPacket, parseBufferPacket } from './buffer'

const { describe, it } = global

describe('Node.Buffer', () => {
  const headerString = 'headerString'
  const payloadBuffer = Buffer.from('payloadBuffer')

  it('packBufferPacket()', () => {
    const packet = packBufferPacket(headerString, payloadBuffer)
    equal(packet.length, 2 + Buffer.byteLength(headerString) + payloadBuffer.length)
  })

  it('parseBufferPacket()', () => {
    const packet = packBufferPacket(headerString, payloadBuffer)
    const [ parsedHeaderString, parsedPayloadBuffer ] = parseBufferPacket(packet)
    equal(headerString, parsedHeaderString)
    equal(payloadBuffer.compare(parsedPayloadBuffer), 0)
  })
})
