import { strictEqual, notStrictEqual } from 'source/common/verify'
import { statSync } from 'fs'
import {
  getEntityTagByContentHash,
  getEntityTagByContentHashAsync,
  getWeakEntityTagByStat
} from './EntityTag'

const { describe, it } = global

describe('Node.Module.EntityTag', () => {
  it('getEntityTagByContentHash()', () => {
    strictEqual(getEntityTagByContentHash(Buffer.from('0')), getEntityTagByContentHash(Buffer.from('0')))
    notStrictEqual(getEntityTagByContentHash(Buffer.from('1')), getEntityTagByContentHash(Buffer.from('')))
  })

  it('getEntityTagByContentHashAsync()', async () => {
    strictEqual(await getEntityTagByContentHashAsync(Buffer.from('0')), await getEntityTagByContentHashAsync(Buffer.from('0')))
    notStrictEqual(await getEntityTagByContentHashAsync(Buffer.from('1')), await getEntityTagByContentHashAsync(Buffer.from('')))

    strictEqual(await getEntityTagByContentHashAsync(Buffer.from('0')), getEntityTagByContentHash(Buffer.from('0')))
    notStrictEqual(await getEntityTagByContentHashAsync(Buffer.from('1')), getEntityTagByContentHash(Buffer.from('')))
  })

  it('getWeakEntityTagByStat()', () => {
    const stat = statSync(__filename)
    const statDir = statSync(__dirname)
    strictEqual(getWeakEntityTagByStat(stat), getWeakEntityTagByStat(stat))
    notStrictEqual(getWeakEntityTagByStat(stat), getWeakEntityTagByStat(statDir))
  })
})
