import { strictEqual } from 'source/common/verify'
import { getUnusedPort, autoTestServerPort } from './function'
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
    await start()

    await getUnusedPort(port, '0.0.0.0').then(
      () => { throw new Error('should throw port token error') },
      (error) => `good, expected Error: ${error}`
    )

    await stop()
  })

  it('autoTestServerPort() check', async () => {
    const occupyPort = async () => {
      const port = await getUnusedPort()
      const { start, stop } = createServer({ protocol: 'http:', hostname: '0.0.0.0', port })
      await start()
      return { port, stop }
    }

    const occupyPortServerList = [
      await occupyPort(),
      await occupyPort(),
      await occupyPort()
    ]

    const expectPort = await getUnusedPort()

    const resultPort = await autoTestServerPort([
      ...occupyPortServerList.map(({ port }) => port),
      expectPort
    ], '0.0.0.0')

    await Promise.all(occupyPortServerList.map(({ stop }) => stop()))

    strictEqual(resultPort, expectPort, 'should pick detected unused port')
  })
})
