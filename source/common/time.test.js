import { notStrictEqual } from 'assert'
import { clock, requestFrameUpdate } from './time'

const { describe, it } = global

describe('Common.Time', () => {
  it('clock() should get msec precision', () => {
    notStrictEqual(clock() - clock(), 0)
  })

  it('requestFrameUpdate() should invoke under 500 msec', () => new Promise((resolve, reject) => {
    requestFrameUpdate(resolve)
    setTimeout(() => reject(new Error('requestFrameUpdate did not call after 500msec')), 500)
  }))
})
