import { strictEqual } from 'assert'
import { getUnusedPort } from './function'
import { createServer } from './Server'

const { describe, it } = global

describe('Node.Server.function', () => {
  it('getUnusedPort() single', async () => {
    const port = await getUnusedPort()

    strictEqual(typeof (port), 'number')
  })

  it('getUnusedPort() multiple', async () => {
    const portList = await Promise.all([
      getUnusedPort(),
      getUnusedPort(),
      getUnusedPort(),
      getUnusedPort(),
      getUnusedPort(),
      getUnusedPort(),
      getUnusedPort(),
      getUnusedPort()
    ])

    strictEqual(portList.length, new Set(portList).size)
  })

  it('getUnusedPort() check', async () => {
    const port = await getUnusedPort()

    const { start, stop } = createServer({ protocol: 'http:', hostname: '0.0.0.0', port })
    start()

    await getUnusedPort(port, '0.0.0.0').then(
      () => { throw new Error('should throw port token error') },
      (error) => `good, expected Error: ${error}`
    )

    stop()
  })
})
