import { stringifyEqual } from 'source/common/verify.js'
import { toCountMap, tally } from './CountMap.js'

const { describe, it } = globalThis

describe('Common.Data.CountMap', () => {
  it('toCountMap()', () => {
    const cm = toCountMap()
    stringifyEqual(cm.cnt('k'), 0)
    cm.inc1('k')
    stringifyEqual(cm.cnt('k'), 1)
    cm.inc('k', 20)
    stringifyEqual(cm.cnt('k'), 21)
    cm.inc('k', -20)
    stringifyEqual(cm.cnt('k'), 1)
    cm.dec1('k')
    stringifyEqual(cm.cnt('k'), 0)
    cm.dec('k', 20)
    stringifyEqual(cm.cnt('k'), -20)
    cm.dec('k', -20)
    stringifyEqual(cm.cnt('k'), 0)
    cm.map.set('k', 20)
    stringifyEqual(cm.cnt('k'), 20)
    cm.map.delete('k')
    stringifyEqual(cm.cnt('k'), 0)
  })

  it('tally()', () => {
    stringifyEqual(
      Object.fromEntries(tally('qqwweerwrwscsdsdcsdvdsdweqscsewef'.split('')).entries()),
      {
        'q': 3,
        'w': 6,
        'e': 5,
        'r': 2,
        's': 7,
        'c': 3,
        'd': 5,
        'v': 1,
        'f': 1
      }
    )
  })
})
