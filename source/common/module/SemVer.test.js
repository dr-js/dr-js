import { strictEqual, stringifyEqual, doThrow, truthy } from 'source/common/verify.js'
import {
  parseSemVer, compareSemVer,

  versionBumpByGitBranch,
  versionBumpToIdentifier,
  versionBumpLastNumber,
  versionBumpToLocal
} from './SemVer.js'

const { describe, it } = globalThis

describe('Common.Module.SemVer', () => {
  it('parseSemVer()', () => {
    doThrow(() => parseSemVer(''), 'should throw on error SemVer')
    doThrow(() => parseSemVer('0.0.'), 'should throw on error SemVer')
    doThrow(() => parseSemVer('0'), 'should throw on error SemVer')
    doThrow(() => parseSemVer('0.0.0.0'), 'should throw on error SemVer')
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
    strictEqual(compareSemVer('0.0.1', '0.0.0'), 1)
    strictEqual(compareSemVer('0.1.0', '0.0.9'), 1)
    strictEqual(compareSemVer('1.0.0', '0.9.9'), 1)
    strictEqual(compareSemVer('0.0.2', '0.0.1'), 1)
    strictEqual(compareSemVer('0.0.2', '0.0.1'), 1)
    strictEqual(compareSemVer('1.6.0', '1.2.3'), 4)
    strictEqual(compareSemVer('5.0.0', '1.2.3'), 4)
    strictEqual(compareSemVer('111.2.2', '111.2.1'), 1)

    strictEqual(compareSemVer('0.0.0-dev', '0.0.0-dev'), 0)
    strictEqual(compareSemVer('0.0.0-dev-', '0.0.0-dev'), 1)
    strictEqual(compareSemVer('0.0.0', '0.0.0-dev'), 1)
    strictEqual(compareSemVer('0.0.0', '0.0.0-dev'), 1)
    strictEqual(compareSemVer('0.0.0-dev.1', '0.0.0-dev.0'), 1)
    strictEqual(compareSemVer('0.0.0-dev.01', '0.0.0-dev.0'), 1)
    strictEqual(compareSemVer('0.0.0-dev.0-', '0.0.0-dev.0'), 1)
    strictEqual(compareSemVer('0.0.0-dev.11', '0.0.0-dev.1'), 10)
    strictEqual(compareSemVer('0.0.0-dev.10', '0.0.0-dev.2'), 8)
    strictEqual(compareSemVer('0.0.0-dev.0-local.10', '0.0.0-dev.0-local.2'), 8)
    strictEqual(compareSemVer('0.0.0-dev.0-local.10', '0.0.0-dev.0'), 1)
    strictEqual(compareSemVer('0.0.0-beta', '0.0.0-alpha'), 1)
    strictEqual(compareSemVer('0.0.0-aaab', '0.0.0-aaaa'), 1)

    // test copied from node-semver // https://github.com/npm/node-semver/blob/v7.3.5/test/fixtures/comparisons.js
    const TEST_LIST = [ // [ version1, version2 ] version1 should be greater than version2
      [ '0.0.0', '0.0.0-foo' ],
      [ '0.0.1', '0.0.0' ],
      [ '1.0.0', '0.9.9' ],
      [ '0.10.0', '0.9.0' ],
      [ '0.99.0', '0.10.0', {} ],
      [ '2.0.0', '1.2.3', { loose: false } ],
      [ 'v0.0.0', '0.0.0-foo', true ],
      [ 'v0.0.1', '0.0.0', { loose: true } ],
      [ 'v1.0.0', '0.9.9', true ],
      [ 'v0.10.0', '0.9.0', true ],
      [ 'v0.99.0', '0.10.0', true ],
      [ 'v2.0.0', '1.2.3', true ],
      [ '0.0.0', 'v0.0.0-foo', true ],
      [ '0.0.1', 'v0.0.0', true ],
      [ '1.0.0', 'v0.9.9', true ],
      [ '0.10.0', 'v0.9.0', true ],
      [ '0.99.0', 'v0.10.0', true ],
      [ '2.0.0', 'v1.2.3', true ],
      [ '1.2.3', '1.2.3-asdf' ],
      [ '1.2.3', '1.2.3-4' ],
      [ '1.2.3', '1.2.3-4-foo' ],
      [ '1.2.3-5-foo', '1.2.3-5' ],
      [ '1.2.3-5', '1.2.3-4' ],
      [ '1.2.3-5-foo', '1.2.3-5-Foo' ],
      [ '3.0.0', '2.7.2+asdf' ],
      [ '1.2.3-a.10', '1.2.3-a.5' ],
      [ '1.2.3-a.b', '1.2.3-a.5' ],
      [ '1.2.3-a.b', '1.2.3-a' ],
      [ '1.2.3-a.b.c.10.d.5', '1.2.3-a.b.c.5.d.100' ],
      [ '1.2.3-r2', '1.2.3-r100' ],
      [ '1.2.3-r100', '1.2.3-R2' ]
    ]
    const versionFix = (version) => {
      if (version.startsWith('v')) version = version.slice(1) // drop leading "v"
      if (version.includes('+')) version = version.split('+')[ 0 ] // drop metadata
      return version
    }
    for (const [ version, versionSmaller ] of TEST_LIST.map(([ a, b ]) => [ versionFix(a), versionFix(b) ])) {
      truthy(compareSemVer(version, versionSmaller) > 0, `"${version}" should be bigger than "${versionSmaller}"`)
      truthy(compareSemVer(versionSmaller, version) < 0, `"${versionSmaller}" should be smaller than "${version}"`)
    }
  })

  it('versionBumpByGitBranch()', () => {
    strictEqual(versionBumpByGitBranch('1.0.0', { gitBranch: 'master' }), '1.0.1')
    strictEqual(versionBumpByGitBranch('1.0.0-with-label', { gitBranch: 'master' }), '1.0.0')

    strictEqual(versionBumpByGitBranch('1.0.0', { gitBranch: 'other-dev_branch' }), '1.0.1-otherdevbranch.0')
    strictEqual(versionBumpByGitBranch('1.0.0-with-label', { gitBranch: 'other-dev_branch' }), '1.0.0-otherdevbranch.0')
    strictEqual(versionBumpByGitBranch('1.0.0-otherdevbranch.0', { gitBranch: 'other-dev_branch' }), '1.0.0-otherdevbranch.1')
  })

  it('versionBumpToIdentifier()', () => {
    strictEqual(versionBumpToIdentifier('1.0.0', { identifier: 'TEST' }), '1.0.1-TEST.0')
    strictEqual(versionBumpToIdentifier('1.0.0-dev.0', { identifier: 'TEST' }), '1.0.0-TEST.0')
    strictEqual(versionBumpToIdentifier('1.0.0-TEST.0', { identifier: 'TEST' }), '1.0.0-TEST.1')
    strictEqual(versionBumpToIdentifier('1.0.0-TEST.0.local.0', { identifier: 'TEST' }), '1.0.0-TEST.1')
    strictEqual(versionBumpToIdentifier('1.0.0-TEST.0AAA', { identifier: 'TEST' }), '1.0.1-TEST.0')
  })

  it('versionBumpLastNumber()', () => {
    strictEqual(versionBumpLastNumber('1.0.0'), '1.0.1')
    strictEqual(versionBumpLastNumber('1.0.0-dev.0'), '1.0.0-dev.1')
    strictEqual(versionBumpLastNumber('1.0.0-dev19abc'), '1.0.0-dev20abc')
  })

  it('versionBumpToLocal()', () => {
    strictEqual(versionBumpToLocal('1.0.0'), '1.0.0-local.0')
    strictEqual(versionBumpToLocal('1.0.0-local.0'), '1.0.0-local.1')
    strictEqual(versionBumpToLocal('1.0.0-with-label'), '1.0.0-with-label.local.0')
    strictEqual(versionBumpToLocal('1.0.0-with-label.local.0'), '1.0.0-with-label.local.1')
    strictEqual(versionBumpToLocal('1.0.0-with-label-local.0'), '1.0.0-with-label-local.0.local.0')
  })
})
