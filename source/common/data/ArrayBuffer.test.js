import { ok } from 'assert'
import {
  packBufferString,
  parseBufferString,

  packUint16String,
  parseUint16String,

  compareArrayBuffer
} from './ArrayBuffer'

const { describe, it } = global

describe('Common.Data.ArrayBuffer', () => {
  describe('BufferString', () => {
    it('test odd', () => {
      const odd = Uint8Array.of(1, 2, 3, 4, 5)
      const bo = odd.buffer
      const bso = packBufferString(bo)
      const pso = parseBufferString(bso)
      ok(compareArrayBuffer(bo, pso))
    })

    it('test even', () => {
      const even = Uint8Array.of(1, 2, 3, 4)
      const be = even.buffer
      const bse = packBufferString(be)
      const pse = parseBufferString(bse)
      ok(compareArrayBuffer(be, pse))
    })
  })

  describe('Uint16String', () => {
    it('test odd', () => {
      const odd = Uint8Array.of(1, 2, 3, 4, 5)
      const bo = odd.buffer
      const bso = packUint16String(bo)
      const pso = parseUint16String(bso)
      ok(compareArrayBuffer(bo, pso))
    })

    it('test even', () => {
      const even = Uint8Array.of(1, 2, 3, 4)
      const be = even.buffer
      const bse = packUint16String(be)
      const pse = parseUint16String(bse)
      ok(compareArrayBuffer(be, pse))
    })
  })
})
