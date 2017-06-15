import nodeModuleAssert from 'assert'
import { log, warn, error, assert } from './function'

const { describe, it } = global

describe('Common.Env.function', () => {
  it('log(), warn(), error() doesNotThrow', () => nodeModuleAssert.doesNotThrow(() => {
    log(1, 'a', {})
    warn(1, 'a', {})
    error(1, 'a', {})
  }))
  it('assert() doesNotThrow', () => nodeModuleAssert.doesNotThrow(() => assert(true, 'doesNotThrow on true')))
  it('assert() throws', () => {
    let hasErrorThrown = false
    try { assert(false, 'throws on false') } catch (error) { hasErrorThrown = Boolean(error) }
    nodeModuleAssert.equal(hasErrorThrown, true)
  })
})
