import nodeModuleAssert from 'assert'
import { getGlobal, getEnvironment, getSystemEndianness, log, warn, error, assert } from './index'

const { describe, it } = global

describe('Env', () => {
  it('getGlobal() equal global in node', () => nodeModuleAssert.equal(getGlobal(), global))

  it('getEnvironment().environmentName should be node', () => nodeModuleAssert.equal(getEnvironment().environmentName, 'node'))

  it('getSystemEndianness() should not be unknown', () => nodeModuleAssert.notEqual(getSystemEndianness(), 'unknown'))

  it('log(), warn(), error() doesNotThrow', () => {
    log(1, 'a', {})
    warn(1, 'a', {})
    error(1, 'a', {})
  })

  it('assert(true) should not throw', () => assert(true, 'assert(true)'))

  it('assert(false) should throw', () => {
    let getExpectedError = false
    try { assert(false, 'assert(false)') } catch (error) { getExpectedError = Boolean(error) }
    nodeModuleAssert.equal(getExpectedError, true)
  })
})
