import { stringifyEqual } from 'source/common/verify.js'

import {
  parsePackageNameAndVersion,
  toPackageTgzName
} from './PackageJSON.js'

const { describe, it } = globalThis

describe('Common.Module.PackageJSON', () => {
  it('parsePackageNameAndVersion()', () => {
    stringifyEqual(parsePackageNameAndVersion('aaa@0.0.0'), [ 'aaa', '0.0.0' ])
    stringifyEqual(parsePackageNameAndVersion('aaa@'), [])
    stringifyEqual(parsePackageNameAndVersion('aaa'), [])

    stringifyEqual(parsePackageNameAndVersion('@aaa/aaa@0.0.0'), [ '@aaa/aaa', '0.0.0' ])
    stringifyEqual(parsePackageNameAndVersion('@aaa/aaa@'), [])
    stringifyEqual(parsePackageNameAndVersion('@aaa/aaa'), [])
  })
  it('toPackageTgzName()', () => {
    stringifyEqual(toPackageTgzName('aaa', '0.0.0'), 'aaa-0.0.0.tgz')
    stringifyEqual(toPackageTgzName('@aaa/aaa', '0.0.0'), 'aaa-aaa-0.0.0.tgz')
  })
})
