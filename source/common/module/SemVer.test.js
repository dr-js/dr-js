import { strictEqual, deepStrictEqual, throws } from 'assert'
import { parseSemVer, compareSemVer } from './SemVer'

const { describe, it } = global

describe('Common.Module.SemVer', () => {
  it('parseSemVer()', () => {
    throws(() => parseSemVer(''), 'should throw on error SemVer')
    throws(() => parseSemVer('0.0.'), 'should throw on error SemVer')
    throws(() => parseSemVer('0'), 'should throw on error SemVer')
    throws(() => parseSemVer('a0.0.0'), 'should throw on error SemVer')
    throws(() => parseSemVer('a.b.c'), 'should throw on error SemVer')

    deepStrictEqual(parseSemVer('0.0.0'), { major: 0, minor: 0, patch: 0, label: '' })
    deepStrictEqual(parseSemVer('00.00.01'), { major: 0, minor: 0, patch: 1, label: '' })
    deepStrictEqual(parseSemVer('1.2.3'), { major: 1, minor: 2, patch: 3, label: '' })
    deepStrictEqual(parseSemVer('0.0.0-label'), { major: 0, minor: 0, patch: 0, label: '-label' })
    deepStrictEqual(parseSemVer('0.0.0-dev.0'), { major: 0, minor: 0, patch: 0, label: '-dev.0' })
    deepStrictEqual(parseSemVer('0.0.0-dev.0-local.0'), { major: 0, minor: 0, patch: 0, label: '-dev.0-local.0' })
    deepStrictEqual(parseSemVer('999.999.999'), { major: 999, minor: 999, patch: 999, label: '' })
    deepStrictEqual(parseSemVer('999.999.999-999.999.999'), { major: 999, minor: 999, patch: 999, label: '-999.999.999' })
  })

  it('compareSemVer()', () => {
    strictEqual(compareSemVer('0.0.0', '0.0.00'), 0)
    strictEqual(compareSemVer('0.0.0', '0.0.1'), -1)
    strictEqual(compareSemVer('0.0.9', '0.1.0'), -1)
    strictEqual(compareSemVer('0.9.9', '1.0.0'), -1)
    strictEqual(compareSemVer('0.0.1', '0.0.2'), -1)
    strictEqual(compareSemVer('0.0.2', '0.0.1'), 1)
    strictEqual(compareSemVer('1.2.3', '1.6.0'), -4)
    strictEqual(compareSemVer('1.2.3', '5.0.0'), -4)
    strictEqual(compareSemVer('111.2.2', '111.2.1'), 1)

    strictEqual(compareSemVer('0.0.0-dev', '0.0.0-dev'), 0)
    strictEqual(compareSemVer('0.0.0-dev', '0.0.0-dev-'), -1)
    strictEqual(compareSemVer('0.0.0-dev', '0.0.0'), -1)
    strictEqual(compareSemVer('0.0.0', '0.0.0-dev'), 1)
    strictEqual(compareSemVer('0.0.0-dev.0', '0.0.0-dev.1'), -1)
    strictEqual(compareSemVer('0.0.0-alpha', '0.0.0-beta'), -1)
    strictEqual(compareSemVer('0.0.0-aaaa', '0.0.0-aaab'), -1)
  })
})
