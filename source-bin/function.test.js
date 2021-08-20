import { truthy, basicArray } from 'source/common/verify.js'

const { describe, it } = globalThis

describe('Bin.Function', () => {
  it('HACK: "require(\'module\')._resolveLookupPaths(\'modulePaths\')" should be Array', () => {
    truthy(basicArray(require('module')._resolveLookupPaths('modulePaths')))
  })
})
