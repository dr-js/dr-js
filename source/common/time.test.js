import { notStrictEqual, stringifyEqual } from 'source/common/verify.js'
import { clock, requestFrameUpdate, setAwaitAsync } from './time.js'

const { describe, it } = global

describe('Common.Time', () => {
  it('clock() should get msec precision', async () => {
    const timeStart = clock()
    ' '.repeat(256).split('').forEach(() => clock()) // NOTE: increase loop if too fast for V8
    const timeDiff = clock() - timeStart
    notStrictEqual(timeDiff, 0)
  })

  it('requestFrameUpdate() should invoke under 500 msec', () => new Promise((resolve, reject) => {
    requestFrameUpdate(resolve)
    setTimeout(() => reject(new Error('requestFrameUpdate did not call after 500msec')), 500)
  }))

  it('setAwaitAsync() execute order', () => {
    const logList = []
    const log = (...args) => logList.push(args.join(' '))

    const F1 = async (v) => {
      log('F1 ==', v)
      await null
      log('F1 ++', v)
    }
    const F2 = async (v) => {
      log('F2 ==', v)
      await new Promise((resolve) => resolve())
      log('F2 ++', v)
    }
    const FT = async (v) => {
      log('FT ==', v)
      await setAwaitAsync(0)
      log('FT ++', v)
    }

    return Promise.all([
      F1('0'), F2('a'),
      FT('!'),
      F1('1'), F2('b')
    ]).then(() => stringifyEqual(logList, [
      'F1 == 0', 'F2 == a',
      'FT == !',
      'F1 == 1', 'F2 == b',
      'F1 ++ 0', 'F2 ++ a',
      'FT ++ !',
      'F1 ++ 1', 'F2 ++ b'
    ]))
  })
})
