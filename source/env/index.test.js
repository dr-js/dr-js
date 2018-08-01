import { strictEqual, notStrictEqual, throws, doesNotThrow } from 'assert'
import { getGlobal, getEnvironment } from './global'
import { getEndianness, assert } from './function'

const { describe, it } = global

const wrapMuteConsoleError = (func) => () => {
  const consoleError = console.error
  console.error = () => {}
  func()
  console.error = consoleError
}

describe('Env', () => {
  it('getGlobal() strictEqual global in node', () => {
    strictEqual(getGlobal(), global)
  })

  it('getEnvironment().environmentName should be node', () => {
    strictEqual(getEnvironment().environmentName, 'node')
  })

  it('getEndianness() should not be unknown', () => {
    notStrictEqual(getEndianness(), 'unknown')
  })

  it('assert(true) should not throw', wrapMuteConsoleError(() => {
    doesNotThrow(() => assert(true, 'assert(true)'))
  }))

  it('assert(false) should throw', wrapMuteConsoleError(() => {
    throws(() => assert(false, 'assert(false)'))
  }))
})
