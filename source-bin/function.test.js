import { strictEqual, basicArray } from 'source/common/verify.js'

const { describe, it } = global

describe('Bin.Function', () => {
  it('HACK: "require(\'module\')._resolveLookupPaths(\'modulePaths\')" should be Array', () => {
    strictEqual(basicArray(require('module')._resolveLookupPaths('modulePaths')), true)
  })
})
