import { equal, notEqual, throws, doesNotThrow } from 'assert'
import { getGlobal, getEnvironment, getSystemEndianness, assert } from './env'

const { describe, it } = global

const wrapMuteConsoleError = (func) => () => {
  const consoleError = console.error
  console.error = () => {}
  func()
  console.error = consoleError
}

describe('Env', () => {
  it('getGlobal() equal global in node', () => equal(getGlobal(), global))

  it('getEnvironment().environmentName should be node', () => equal(getEnvironment().environmentName, 'node'))

  it('getSystemEndianness() should not be unknown', () => notEqual(getSystemEndianness(), 'unknown'))

  it('assert(true) should not throw', wrapMuteConsoleError(() => {
    doesNotThrow(() => assert(true, 'assert(true)'))
  }))

  it('assert(false) should throw', wrapMuteConsoleError(() => {
    throws(() => assert(false, 'assert(false)'))
  }))
})
