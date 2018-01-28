import { equal, notEqual } from 'assert'
import { statSync } from 'fs'
import {
  getEntityTagByContentHash,
  getWeakEntityTagByStat
} from './EntityTag'

const { describe, it } = global

describe('Node.Module.EntityTag', () => {
  it('getEntityTagByContentHash()', () => {
    equal(getEntityTagByContentHash(Buffer.from('')), getEntityTagByContentHash(Buffer.from('')))
    notEqual(getEntityTagByContentHash(Buffer.from('1')), getEntityTagByContentHash(Buffer.from('')))
  })

  it('getWeakEntityTagByStat()', () => {
    const stat = statSync(__filename)
    const statDir = statSync(__dirname)
    equal(getWeakEntityTagByStat(stat), getWeakEntityTagByStat(stat))
    notEqual(getWeakEntityTagByStat(stat), getWeakEntityTagByStat(statDir))
  })
})
