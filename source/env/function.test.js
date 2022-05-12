import { notStrictEqual, doThrow, doNotThrow } from 'source/common/verify.js'
import { getEndianness, assert } from './function.js'

const { describe, it } = globalThis

const wrapMuteConsoleError = (func) => () => {
  const consoleError = console.error
  console.error = () => {}
  func()
  console.error = consoleError
}

describe('Env.function', () => {
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
