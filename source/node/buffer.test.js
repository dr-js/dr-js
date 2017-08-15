import nodeModuleAssert from 'assert'
import { packBufferPacket, parseBufferPacket } from './buffer'

const { describe, it } = global
global.__DEV__ = false

describe('Node.Buffer', () => {
  const headerString = 'headerString'
  const payloadBuffer = Buffer.from('payloadBuffer')

  it('packBufferPacket()', () => {
    const packet = packBufferPacket(headerString, payloadBuffer)
    nodeModuleAssert.equal(packet.length, 2 + Buffer.byteLength(headerString) + payloadBuffer.length)
  })

  it('parseBufferPacket()', () => {
    const packet = packBufferPacket(headerString, payloadBuffer)
    const [ parsedHeaderString, parsedPayloadBuffer ] = parseBufferPacket(packet)
    nodeModuleAssert.equal(headerString, parsedHeaderString)
    nodeModuleAssert.equal(payloadBuffer.compare(parsedPayloadBuffer), 0)
  })
})
