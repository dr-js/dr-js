import { strictEqual, notStrictEqual, doThrow, doNotThrow } from 'source/common/verify'
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
    notStrictEqual(getEnvironment().environmentName, 'unknown')
  })

  it('getEndianness() should not be unknown', () => {
    notStrictEqual(getEndianness(), 'unknown')
  })

  it('assert(true) should not throw', wrapMuteConsoleError(() => {
    doNotThrow(() => assert(true, 'assert(true)'))
  }))

  it('assert(false) should throw', wrapMuteConsoleError(() => {
    doThrow(() => assert(false, 'assert(false)'))
  }))
})
