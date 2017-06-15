import nodeModuleAssert from 'assert'
import { getGlobal, getEnvironment, getSystemEndianness } from './__utils__'

const { describe, it } = global

describe('Common.Env.utils', () => {
  it('getGlobal() equal global in node', () => nodeModuleAssert.equal(getGlobal(), global))
  it('getEnvironment().environmentName should be node', () => nodeModuleAssert.equal(getEnvironment().environmentName, 'node'))
  it('getSystemEndianness() should not be unknown', () => nodeModuleAssert.notEqual(getSystemEndianness(), 'unknown'))
})
