import { equal, notEqual } from 'assert'
import { statSync } from 'fs'
import {
  getEntityTagByContentHash,
  getEntityTagByContentHashAsync,
  getWeakEntityTagByStat
} from './EntityTag'

const { describe, it } = global

describe('Node.Module.EntityTag', () => {
  it('getEntityTagByContentHash()', () => {
    equal(getEntityTagByContentHash(Buffer.from('0')), getEntityTagByContentHash(Buffer.from('0')))
    notEqual(getEntityTagByContentHash(Buffer.from('1')), getEntityTagByContentHash(Buffer.from('')))
  })

  it('getEntityTagByContentHashAsync()', async () => {
    equal(await getEntityTagByContentHashAsync(Buffer.from('0')), await getEntityTagByContentHashAsync(Buffer.from('0')))
    notEqual(await getEntityTagByContentHashAsync(Buffer.from('1')), await getEntityTagByContentHashAsync(Buffer.from('')))

    equal(await getEntityTagByContentHashAsync(Buffer.from('0')), getEntityTagByContentHash(Buffer.from('0')))
    notEqual(await getEntityTagByContentHashAsync(Buffer.from('1')), getEntityTagByContentHash(Buffer.from('')))
  })

  it('getWeakEntityTagByStat()', () => {
    const stat = statSync(__filename)
    const statDir = statSync(__dirname)
    equal(getWeakEntityTagByStat(stat), getWeakEntityTagByStat(stat))
    notEqual(getWeakEntityTagByStat(stat), getWeakEntityTagByStat(statDir))
  })
})
