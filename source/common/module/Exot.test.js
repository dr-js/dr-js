import { strictEqual, doThrow, doThrowAsync } from 'source/common/verify'
import { createInsideOutPromise } from 'source/common/function'
import { setTimeoutAsync } from 'source/common/time'
import { getRandomId } from 'source/common/math/random'
import { getGlobal } from 'source/env/global'

import { createExotError, createDummyExot, isExot, createExotGroup } from './Exot'

const { describe, it, info = console.log } = global

describe('source/common/module/Exot', () => {
  it('isExot()', () => {
    strictEqual(isExot(), false)
    strictEqual(isExot(null), false)
    strictEqual(isExot({}), false)
    strictEqual(isExot(createDummyExot()), true)
    strictEqual(isExot(createSampleExot({ sampleConfig: { key: 'sample' } })), true)
    strictEqual(isExot(createExotGroup()), true)
  })

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

  // TODO: it('createExotGroup()', async () => {})
})

const createSampleExot = ({ // most Exot create func should be just sync, and move async things to up()
  // ## pattern
  id = getRandomId('SAMPLE-EXOT-'), // unique string id, or specific name like "server-HTTP"
  // ## other option to config this Exot
  sampleConfig = {}
} = {}) => {
  let _onExotError
  let _isUp = false

  const up = async ( // NOTE: can also be sync, outer func better use await for both
    // ## pattern (the ONLY option, so Exot config can't suddenly change, and make pattern simple)
    onExotError // (error) => {} // can be OPTIONAL, mostly for ACK error outside of Exot function call, non-expert outside code should handle by `down` the Exot
  ) => {
    if (_isUp) throw new Error('already up')
    if (!onExotError) throw new Error('expect onExotError to receive ExotError notice')
    await setTimeoutAsync(10) // pretend WORKING
    getGlobal()[ id ] = { id, sampleConfig }
    _onExotError = onExotError
    _isUp = true // late set (call up again during up should be a bug, a check here is optional, but not required)
  }

  const down = async () => { // NO throw/reject, should confidently release external resource, and allow call when down (do nothing) // NOTE: can also be sync, outer func better use await for both
    if (!_isUp) return // skip
    _onExotError = undefined
    _isUp = false // early set (since this should not throw)
    await setTimeoutAsync(10) // pretend WORKING
    delete getGlobal()[ id ]
  }

  // NOTE: not extend state to `up.../up/down.../down` to keep the pattern simple, and when lifecycle code is separated and in one place, prevent double calling is easier
  const isUp = () => _isUp // should return `true` on the last line of `up`, and `false` the first line of `down`

  // - async func should resolve on success, never-resolve on ExotError, reject on input Error (Bug):
  //   when Error caused Exot `down` during an in-flight async func, the callback is expected to be dropped if the result can not be generated
  const sampleAsync = async (input) => {
    if (!'pass|late-check-error|exot-error'.split('|').includes(input)) throw new Error(`invalid input ${input}`) // check input, no catch Error
    let result
    try {
      result = await setTimeoutAsync(0).then(() => input === 'exot-error'
        ? Promise.reject(createExotError(id, `ExotError: ${input}`)) // do Exot ASYNC operation and catch error
        : 'Job done'
      )
    } catch (error) { // do Exot operation and catch error
      if (!error.exotId) throw error // report non-ExotError
      // if there'll be left-over error listener after Exot `down`, add a guard to mute the error
      // but if by design no listener should leak, don't bother and mask the bug
      _onExotError && _onExotError(error) // report ExotError through onExotError
      return new Promise(() => {}) // make this operation never resolve
    }
    if (!result || input === 'late-check-error') throw new Error(`invalid result: ${result}, input: ${input}`) // check result, no catch Error (report operation timeout, wrong password, ...)
    return result
  }

  // - sync func just report all Error, since it can not prevent the later code to run,
  //   the Error can be thrown, or returned as `{ error, result }`,
  //   generally sync func will be harder to deal with for the mixed error
  const sampleSync = (input) => {
    if (!'pass|late-check-error|exot-error'.split('|').includes(input)) throw new Error(`invalid input ${input}`) // check input, no catch Error
    let result
    { // eslint-disable-line no-lone-blocks
      if (input === 'exot-error') throw createExotError(id, `ExotError: ${input}`) // do Exot SYNC operation and NOT catch error (but normally a ExotError will not be sync)
      result = 'Job done'
    }
    if (!result || input === 'late-check-error') throw new Error(`invalid result: ${result}, input: ${input}`) // check result, no catch Error
    return result
  }

  return {
    // ## pattern
    id, up, down, isUp,
    // ## other func for sync/async data exchange (IO)
    sampleAsync, sampleSync
  }
}
