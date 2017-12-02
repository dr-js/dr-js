import nodeModuleAssert from 'assert'
import nodeModuleFs from 'fs'
import {
  getEntityTagByContentHash,
  getWeakEntityTagByStat
} from './EntityTag'

const { describe, it } = global

describe('Node.Module.EntityTag', () => {
  it('getEntityTagByContentHash()', () => {
    nodeModuleAssert.equal(getEntityTagByContentHash(Buffer.from('')), getEntityTagByContentHash(Buffer.from('')))
    nodeModuleAssert.notEqual(getEntityTagByContentHash(Buffer.from('1')), getEntityTagByContentHash(Buffer.from('')))
  })

  it('getWeakEntityTagByStat()', () => {
    const stat = nodeModuleFs.statSync(__filename)
    const statDir = nodeModuleFs.statSync(__dirname)
    nodeModuleAssert.equal(getWeakEntityTagByStat(stat), getWeakEntityTagByStat(stat))
    nodeModuleAssert.notEqual(getWeakEntityTagByStat(stat), getWeakEntityTagByStat(statDir))
  })
})
