import { notEqual } from 'assert'
import {
  clock,
  onNextProperUpdate
} from './time'

const { describe, it } = global

describe('Common.Time', () => {
  it('clock() should get msec precision', () => {
    notEqual(clock() - clock(), 0)
  })

  it('onNextProperUpdate() should invoke under 500 msec', () => new Promise((resolve, reject) => {
    onNextProperUpdate(resolve)
    setTimeout(() => reject(new Error('onNextProperUpdate did not call after 500msec')), 500)
  }))
})
