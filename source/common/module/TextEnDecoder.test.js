import { strictEqual } from 'source/common/verify.js'
import {
  TextEncoder, TextDecoder,
  encodeUTF8, decodeUTF8
} from './TextEnDecoder.js'

const { describe, it } = globalThis

const expect = '🕐🕜🕙🕥🕚🕦🕛🕧🕑🕝🕒🕞🕓🕟🕔🕠🕕🕡🕖🕢🕗🕣🕘🕤'

describe('Common.Module.TextEnDecoder', () => {
  it('TextEncoder/TextDecoder', () => {
    const u8List = new TextEncoder().encode(expect)
    const actual = new TextDecoder().decode(u8List)
    strictEqual(actual, expect)
  })
  it('encodeUTF8/decodeUTF8()', () => {
    const u8List = encodeUTF8(expect)
    const actual = decodeUTF8(u8List)
    strictEqual(actual, expect)
  })
})
