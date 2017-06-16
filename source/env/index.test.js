import nodeModuleAssert from 'assert'
import { getGlobal, getEnvironment, getSystemEndianness, log, warn, error, assert } from './index'

const { describe, it } = global

describe('Common.Env.utils', () => {
  it('getGlobal() equal global in node', () => nodeModuleAssert.equal(getGlobal(), global))
  it('getEnvironment().environmentName should be node', () => nodeModuleAssert.equal(getEnvironment().environmentName, 'node'))
  it('getSystemEndianness() should not be unknown', () => nodeModuleAssert.notEqual(getSystemEndianness(), 'unknown'))
  it('log(), warn(), error() doesNotThrow', () => nodeModuleAssert.doesNotThrow(() => {
    log(1, 'a', {})
    warn(1, 'a', {})
    error(1, 'a', {})
  }))
  it('assert(true) doesNotThrow', () => nodeModuleAssert.doesNotThrow(() => assert(true, 'doesNotThrow on true')))
  it('assert(false) throws', () => {
    let hasErrorThrown = false
    try { assert(false, 'throws on false') } catch (error) { hasErrorThrown = Boolean(error) }
    nodeModuleAssert.equal(hasErrorThrown, true)
  })
})
