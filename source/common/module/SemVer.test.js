import { strictEqual, stringifyEqual, doThrow } from 'source/common/verify'
import { parseSemVer, compareSemVer } from './SemVer'

const { describe, it } = global

describe('Common.Module.SemVer', () => {
  it('parseSemVer()', () => {
    doThrow(() => parseSemVer(''), 'should throw on error SemVer')
    doThrow(() => parseSemVer('0.0.'), 'should throw on error SemVer')
    doThrow(() => parseSemVer('0'), 'should throw on error SemVer')
    doThrow(() => parseSemVer('a0.0.0'), 'should throw on error SemVer')
    doThrow(() => parseSemVer('a.b.c'), 'should throw on error SemVer')

    stringifyEqual(parseSemVer('0.0.0'), { major: 0, minor: 0, patch: 0, label: '' })
    stringifyEqual(parseSemVer('00.00.01'), { major: 0, minor: 0, patch: 1, label: '' })
    stringifyEqual(parseSemVer('1.2.3'), { major: 1, minor: 2, patch: 3, label: '' })
    stringifyEqual(parseSemVer('0.0.0-label'), { major: 0, minor: 0, patch: 0, label: '-label' })
    stringifyEqual(parseSemVer('0.0.0-dev.0'), { major: 0, minor: 0, patch: 0, label: '-dev.0' })
    stringifyEqual(parseSemVer('0.0.0-dev.0-local.0'), { major: 0, minor: 0, patch: 0, label: '-dev.0-local.0' })
    stringifyEqual(parseSemVer('999.999.999'), { major: 999, minor: 999, patch: 999, label: '' })
    stringifyEqual(parseSemVer('999.999.999-999.999.999'), { major: 999, minor: 999, patch: 999, label: '-999.999.999' })
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
    strictEqual(compareSemVer('0.0.0-dev', '0.0.0-dev-'), 1)
    strictEqual(compareSemVer('0.0.0-dev', '0.0.0'), -1)
    strictEqual(compareSemVer('0.0.0', '0.0.0-dev'), 1)
    strictEqual(compareSemVer('0.0.0-dev.0', '0.0.0-dev.1'), -1)
    strictEqual(compareSemVer('0.0.0-dev.2', '0.0.0-dev.10'), -8)
    strictEqual(compareSemVer('0.0.0-dev.0-local.2', '0.0.0-dev.0-local.10'), -8)
    strictEqual(compareSemVer('0.0.0-dev.0', '0.0.0-dev.0-local.10'), 1)
    strictEqual(compareSemVer('0.0.0-alpha', '0.0.0-beta'), -1)
    strictEqual(compareSemVer('0.0.0-aaaa', '0.0.0-aaab'), -1)

    // test copied from node-semver
    strictEqual(compareSemVer('0.0.0', '0.0.0-foo'), 1)
    strictEqual(compareSemVer('0.0.1', '0.0.0'), 1)
    strictEqual(compareSemVer('1.0.0', '0.9.9'), 1)
    strictEqual(compareSemVer('0.10.0', '0.9.0'), 1)
    strictEqual(compareSemVer('0.99.0', '0.10.0'), 89)
    strictEqual(compareSemVer('2.0.0', '1.2.3'), 1)
    strictEqual(compareSemVer('1.2.3', '1.2.3-asdf'), 1)
    strictEqual(compareSemVer('1.2.3', '1.2.3-4'), 1)
    strictEqual(compareSemVer('1.2.3', '1.2.3-4-foo'), 1)
    strictEqual(compareSemVer('1.2.3-5', '1.2.3-4'), 1)
    // strictEqual(compareSemVer('1.2.3-5-foo', '1.2.3-5'), 1) // TODO: strange case, not supported currently
    strictEqual(compareSemVer('1.2.3-5-foo', '1.2.3-5-Foo'), 32)
    strictEqual(compareSemVer('3.0.0', '2.7.2+asdf'), 1)
    strictEqual(compareSemVer('1.2.3-a.10', '1.2.3-a.5'), 5)
    strictEqual(compareSemVer('1.2.3-a.b', '1.2.3-a.5'), 45)
    // strictEqual(compareSemVer('1.2.3-a.b', '1.2.3-a'), 1) // TODO: strange case, not supported currently
    strictEqual(compareSemVer('1.2.3-a.b.c.10.d.5', '1.2.3-a.b.c.5.d.100'), 5)
    // strictEqual(compareSemVer('1.2.3-r2', '1.2.3-r100'), 1) // TODO: strange case, not supported currently
    strictEqual(compareSemVer('1.2.3-r100', '1.2.3-R2'), 32)
  })
})
