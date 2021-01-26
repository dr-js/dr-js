import { strictEqual, notStrictEqual } from 'source/common/verify'
import { statSync } from 'fs'
import {
  getEntityTagByContentHash,
  getWeakEntityTagByStat
} from './EntityTag'

const { describe, it } = global

describe('Node.Module.EntityTag', () => {
  it('getEntityTagByContentHash()', () => {
    strictEqual(getEntityTagByContentHash(Buffer.from('0')), getEntityTagByContentHash(Buffer.from('0')))
    notStrictEqual(getEntityTagByContentHash(Buffer.from('1')), getEntityTagByContentHash(Buffer.from('')))
  })

  it('getWeakEntityTagByStat()', () => {
    const stat = statSync(__filename)
    const statDir = statSync(__dirname)
    strictEqual(getWeakEntityTagByStat(stat), getWeakEntityTagByStat(stat))
    notStrictEqual(getWeakEntityTagByStat(stat), getWeakEntityTagByStat(statDir))
  })
})
