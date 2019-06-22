import { notStrictEqual } from 'source/common/verify'
import { clock, requestFrameUpdate } from './time'

const { describe, it } = global

describe('Common.Time', () => {
  it('clock() should get msec precision', async () => {
    const timeStart = clock()
    ' '.repeat(64).split('').forEach(() => clock()) // TODO: NOTE: too fast in browser?
    const timeDiff = clock() - timeStart
    notStrictEqual(timeDiff, 0)
  })

  it('requestFrameUpdate() should invoke under 500 msec', () => new Promise((resolve, reject) => {
    requestFrameUpdate(resolve)
    setTimeout(() => reject(new Error('requestFrameUpdate did not call after 500msec')), 500)
  }))
})
