import { basicArray } from 'source/common/verify.js'

const { describe, it } = globalThis

describe('Bin.Function', () => {
  it('HACK: "require(\'node:module\')._resolveLookupPaths(\'modulePaths\')" should be Array', () => {
    basicArray(require('node:module')._resolveLookupPaths('modulePaths'))
  })
})
