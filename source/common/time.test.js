import { onNextProperUpdate } from './time'

const { describe, it } = global

describe('Common.Time', () => {
  it('onNextProperUpdate() should invoke under 500 msec', () => new Promise((resolve, reject) => {
    onNextProperUpdate(resolve)
    setTimeout(() => reject(new Error('onNextProperUpdate did not call after 500msec')), 500)
  }))
})
