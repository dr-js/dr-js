import { onNextProperUpdate } from './time'

const { describe, it } = global

describe('Common.Time', () => {
  it('onNextProperUpdate() should invoke under 500 msec', (done) => {
    onNextProperUpdate(() => done())
    setTimeout(() => done('timeout'), 500)
  })
})
