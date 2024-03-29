import { strictEqual } from 'source/common/verify.js'
import { createServerExot } from './Server.js'

import {
  getUnusedPort, autoTestServerPort,
  getWSProtocolListParam, packWSProtocolListParam
} from './function.js'

const { describe, it } = globalThis

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

    const { up, down } = createServerExot({ protocol: 'http:', hostname: '0.0.0.0', port })
    await up()

    await getUnusedPort(port, '0.0.0.0').then(
      () => { throw new Error('should throw port token error') },
      (error) => `good, expected Error: ${error}`
    )

    await down()
  })

  it('autoTestServerPort() check', async () => {
    const occupyPort = async () => {
      const port = await getUnusedPort()
      const { up, down } = createServerExot({ protocol: 'http:', hostname: '0.0.0.0', port })
      await up()
      return { port, down }
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

    await Promise.all(occupyPortServerList.map(({ down }) => down()))

    strictEqual(resultPort, expectPort, 'should pick detected unused port')
  })

  it('getWSProtocolListParam/packWSProtocolListParam', () => {
    const key = '1234567890~`!@#$%^&*()_+-=[]{}:";\',.<>/?'
    const value = '~`!@#$%^&*()_+-=[]{}:";\',.<>/?'
    const param = packWSProtocolListParam(key, value)

    strictEqual(
      getWSProtocolListParam([ '', key, value, param ], key),
      value
    )
  })
})
