import { strictEqual, doThrow, doThrowAsync } from 'source/common/verify'
import { createInsideOutPromise } from 'source/common/function'

import { createSampleExot } from './Exot'

const { describe, it, info = console.log } = global

describe('source/common/module/Exot', () => {
  it('createSampleExot() basic', async () => {
    const { id, up, down, isUp, sampleAsync, sampleSync } = createSampleExot({ sampleConfig: { key: 'basic' } })
    info(`[before up] isUp: ${isUp()}, global[ id ]: ${global[ id ]}`)
    strictEqual(Boolean(global[ id ]), false)

    const upPromise = up((error) => {
      info(`unexpected error: ${error}`)
      throw error
    })
    info(`[during up] isUp: ${isUp()}, global[ id ]: ${global[ id ]}`)
    await upPromise
    info(`[after up] isUp: ${isUp()}, global[ id ]: ${global[ id ]}`)
    strictEqual(Boolean(global[ id ]), true)

    await sampleAsync('pass')
    sampleSync('pass')

    const downPromise = down()
    info(`[during down] isUp: ${isUp()}, global[ id ]: ${global[ id ]}`)
    await downPromise
    info(`[after down] isUp: ${isUp()}, global[ id ]: ${global[ id ]}`)
    strictEqual(Boolean(global[ id ]), false)
  })

  it('createSampleExot() error async', async () => {
    const { id, up, down, isUp, sampleAsync } = createSampleExot({ sampleConfig: { key: 'trouble async' } })
    info(`[before up] isUp: ${isUp()}, global[ id ]: ${global[ id ]}`)
    strictEqual(Boolean(global[ id ]), false)

    const { promise, resolve, reject } = createInsideOutPromise()

    await up((error) => {
      if (!error.exotId) {
        info(`unexpected error: ${error}`)
        reject(error)
      }
      info('get expected error')
      down().then(resolve)
    })
    info(`[after up] isUp: ${isUp()}, global[ id ]: ${global[ id ]}`)
    strictEqual(Boolean(global[ id ]), true)

    // pass|late-check-error|exot-error
    await sampleAsync('pass')
    await doThrowAsync(async () => sampleAsync('early-check-error'))
    await doThrowAsync(async () => sampleAsync('late-check-error'))

    info('## async ExotError -> onExotError -> down')
    sampleAsync('exot-error').then(() => {
      info('should not be here')
      process.exit(-2)
    }, () => {
      info('should not be here, either')
      process.exit(-3)
    })
    info(`[during async func] isUp: ${isUp()}, global[ id ]: ${global[ id ]}`)
    strictEqual(Boolean(global[ id ]), true)

    await promise
    info(`[after async func ExotError] isUp: ${isUp()}, global[ id ]: ${global[ id ]}`)
    strictEqual(Boolean(global[ id ]), false)

    info('## already downed: async ExotError -> onExotError (should do nothing)')
    sampleAsync('exot-error').then(() => {
      info('should not be here')
      process.exit(-2)
    }, () => {
      info('should not be here, either')
      process.exit(-3)
    })

    // allow down again
    await down()
    info(`[after down (again)] isUp: ${isUp()}, global[ id ]: ${global[ id ]}`)
    strictEqual(Boolean(global[ id ]), false)
  })

  it('createSampleExot() error sync', async () => {
    const { id, up, down, isUp, sampleSync } = createSampleExot({ sampleConfig: { key: 'trouble async' } })
    info(`[before up] isUp: ${isUp()}, global[ id ]: ${global[ id ]}`)
    strictEqual(Boolean(global[ id ]), false)

    await up((error) => {
      info(`should not be here, error: ${error}`)
      process.exit(-4)
    })
    info(`[after up] isUp: ${isUp()}, global[ id ]: ${global[ id ]}`)
    strictEqual(Boolean(global[ id ]), true)

    // pass|late-check-error|exot-error
    sampleSync('pass')
    doThrow(() => sampleSync('early-check-error'))
    doThrow(() => sampleSync('late-check-error'))

    info('## sync ExotError -> throw -> down')
    doThrow(() => sampleSync('exot-error'))

    info(`[after sync func Error] isUp: ${isUp()}, global[ id ]: ${global[ id ]}`)
    strictEqual(Boolean(global[ id ]), true)

    await down() // manually
    info(`[after down] isUp: ${isUp()}, global[ id ]: ${global[ id ]}`)
    strictEqual(Boolean(global[ id ]), false)

    info('## already downed: sync ExotError -> throw')
    doThrow(() => sampleSync('exot-error'))

    // allow down again
    await down()
    info(`[after down (again)] isUp: ${isUp()}, global[ id ]: ${global[ id ]}`)
    strictEqual(Boolean(global[ id ]), false)
  })
})
