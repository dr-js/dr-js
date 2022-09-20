import { truthy, doThrow, doThrowAsync } from 'source/common/verify.js'
import { createInsideOutPromise } from 'source/common/function.js'
import { setTimeoutAsync } from 'source/common/time.js'
import { getRandomId62S } from 'source/common/math/random.js'

import { createExotError, createDummyExot, isExot, createExotGroup } from './Exot.js'

const { describe, it, info = console.log } = globalThis
const log = __DEV__ ? info : () => {}

describe('source/common/module/Exot', () => {
  it('isExot()', () => {
    truthy(!isExot())
    truthy(!isExot(null))
    truthy(!isExot({}))
    truthy(isExot(createDummyExot()))
    truthy(isExot(createSampleExot({ sampleConfig: { key: 'sample' } })))
    truthy(isExot(createExotGroup()))
  })

  it('createSampleExot() basic', async () => {
    const { id, up, down, isUp, sampleAsync, sampleSync } = createSampleExot({ sampleConfig: { key: 'basic' } })
    log(`[before up] isUp: ${isUp()}, globalThis[ id ]: ${globalThis[ id ]}`)
    truthy(!globalThis[ id ])

    const upPromise = up((error) => {
      log(`unexpected error: ${error}`)
      throw error
    })
    log(`[during up] isUp: ${isUp()}, globalThis[ id ]: ${globalThis[ id ]}`)
    await upPromise
    log(`[after up] isUp: ${isUp()}, globalThis[ id ]: ${globalThis[ id ]}`)
    truthy(globalThis[ id ])

    await sampleAsync('pass')
    sampleSync('pass')

    const downPromise = down()
    log(`[during down] isUp: ${isUp()}, globalThis[ id ]: ${globalThis[ id ]}`)
    await downPromise
    log(`[after down] isUp: ${isUp()}, globalThis[ id ]: ${globalThis[ id ]}`)
    truthy(!globalThis[ id ])
  })

  it('createSampleExot() error async', async () => {
    const { id, up, down, isUp, sampleAsync } = createSampleExot({ sampleConfig: { key: 'trouble async' } })
    log(`[before up] isUp: ${isUp()}, globalThis[ id ]: ${globalThis[ id ]}`)
    truthy(!globalThis[ id ])

    const { promise, resolve, reject } = createInsideOutPromise()

    await up((error) => {
      if (!error.exotId) {
        log(`unexpected error: ${error}`)
        reject(error)
      }
      log('get expected error')
      down().then(resolve)
    })
    log(`[after up] isUp: ${isUp()}, globalThis[ id ]: ${globalThis[ id ]}`)
    truthy(globalThis[ id ])

    // pass|late-check-error|exot-error
    await sampleAsync('pass')
    await doThrowAsync(async () => sampleAsync('early-check-error'))
    await doThrowAsync(async () => sampleAsync('late-check-error'))

    log('## async ExotError -> onExotError -> down')
    sampleAsync('exot-error').then(() => {
      log('should not be here')
      process.exit(-2)
    }, () => {
      log('should not be here, either')
      process.exit(-3)
    })
    log(`[during async func] isUp: ${isUp()}, globalThis[ id ]: ${globalThis[ id ]}`)
    truthy(globalThis[ id ])

    await promise
    log(`[after async func ExotError] isUp: ${isUp()}, globalThis[ id ]: ${globalThis[ id ]}`)
    truthy(!globalThis[ id ])

    log('## already downed: async ExotError -> onExotError (should do nothing)')
    sampleAsync('exot-error').then(() => {
      log('should not be here')
      process.exit(-2)
    }, () => {
      log('should not be here, either')
      process.exit(-3)
    })

    // allow down again
    await down()
    log(`[after down (again)] isUp: ${isUp()}, globalThis[ id ]: ${globalThis[ id ]}`)
    truthy(!globalThis[ id ])
  })

  it('createSampleExot() error sync', async () => {
    const { id, up, down, isUp, sampleSync } = createSampleExot({ sampleConfig: { key: 'trouble async' } })
    log(`[before up] isUp: ${isUp()}, globalThis[ id ]: ${globalThis[ id ]}`)
    truthy(!globalThis[ id ])

    await up((error) => {
      log(`should not be here, error: ${error}`)
      process.exit(-4)
    })
    log(`[after up] isUp: ${isUp()}, globalThis[ id ]: ${globalThis[ id ]}`)
    truthy(globalThis[ id ])

    // pass|late-check-error|exot-error
    sampleSync('pass')
    doThrow(() => sampleSync('early-check-error'))
    doThrow(() => sampleSync('late-check-error'))

    log('## sync ExotError -> throw -> down')
    doThrow(() => sampleSync('exot-error'))

    log(`[after sync func Error] isUp: ${isUp()}, globalThis[ id ]: ${globalThis[ id ]}`)
    truthy(globalThis[ id ])

    await down() // manually
    log(`[after down] isUp: ${isUp()}, globalThis[ id ]: ${globalThis[ id ]}`)
    truthy(!globalThis[ id ])

    log('## already downed: sync ExotError -> throw')
    doThrow(() => sampleSync('exot-error'))

    // allow down again
    await down()
    log(`[after down (again)] isUp: ${isUp()}, globalThis[ id ]: ${globalThis[ id ]}`)
    truthy(!globalThis[ id ])
  })

  // TODO: it('createExotGroup()', async () => {})
})

const createSampleExot = ({ // most Exot create func should be just sync, and move async things to up()
  // ## pattern
  id = getRandomId62S('SAMPLE-EXOT-'), // unique string id, or specific name like "server-HTTP"
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
    globalThis[ id ] = { id, sampleConfig }
    _onExotError = onExotError
    _isUp = true // late set (call up again during up should be a bug, a check here is optional, but not required)
  }

  const down = async () => { // NO throw/reject, should confidently release external resource, and allow call when down (do nothing) // NOTE: can also be sync, outer func better use await for both
    if (!_isUp) return // skip
    _onExotError = undefined
    _isUp = false // early set (since this should not throw)
    await setTimeoutAsync(10) // pretend WORKING
    delete globalThis[ id ]
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
