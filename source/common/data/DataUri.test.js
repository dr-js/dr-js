import { stringifyEqual } from 'source/common/verify'
import { getSampleRange } from 'source/common/math/sample'
import { isEqualArrayBuffer } from 'source/common/data/ArrayBuffer'
import { encode as encodeBase64 } from './Base64'
import { encode, decode } from './DataUri'

const { describe, it } = global

const SAMPLE_ARRAY_BUFFER = Uint8Array.from(getSampleRange(0, 511)).buffer
const SAMPLE_LIST = [
  // [ note, source, dataUri ]
  [ 'String simple', { value: 'string', mime: '', paramMap: null }, 'data:,string' ],
  [ 'String', {
    value: String.fromCharCode(
      ...getSampleRange(0, 15),
      ...getSampleRange(64, 64 + 15),
      ...getSampleRange(1024, 1024 + 15),
      ...getSampleRange(65535 - 15, 65535)
    ),
    mime: '',
    paramMap: null
  }, 'data:,%00%01%02%03%04%05%06%07%08%09%0A%0B%0C%0D%0E%0F%40ABCDEFGHIJKLMNO%D0%80%D0%81%D0%82%D0%83%D0%84%D0%85%D0%86%D0%87%D0%88%D0%89%D0%8A%D0%8B%D0%8C%D0%8D%D0%8E%D0%8F%EF%BF%B0%EF%BF%B1%EF%BF%B2%EF%BF%B3%EF%BF%B4%EF%BF%B5%EF%BF%B6%EF%BF%B7%EF%BF%B8%EF%BF%B9%EF%BF%BA%EF%BF%BB%EF%BF%BC%EF%BF%BD%EF%BF%BE%EF%BF%BF' ],

  [ 'JSON String string', { value: JSON.stringify('string'), mime: '', paramMap: null }, 'data:,%22string%22' ],
  [ 'JSON String boolean', { value: JSON.stringify(true), mime: '', paramMap: null }, 'data:,true' ],
  [ 'JSON String array', { value: JSON.stringify([ 1, true, '"!@#$%^&*()', [] ]), mime: '', paramMap: null }, 'data:,%5B1%2Ctrue%2C%22%5C%22!%40%23%24%25%5E%26*()%22%2C%5B%5D%5D' ],
  [ 'JSON String object', { value: JSON.stringify({ a: 1, b: true, c: 'string', d: [] }), mime: '', paramMap: null }, 'data:,%7B%22a%22%3A1%2C%22b%22%3Atrue%2C%22c%22%3A%22string%22%2C%22d%22%3A%5B%5D%7D' ],

  [ 'ArrayBuffer simple', { value: SAMPLE_ARRAY_BUFFER, mime: '', paramMap: null }, `data:base64,${encodeBase64(SAMPLE_ARRAY_BUFFER)}` ],

  [ 'String with mime', { value: 'string', mime: 'abc/xyz', paramMap: null }, 'data:abc/xyz,string' ],
  [ 'ArrayBuffer with mime', { value: SAMPLE_ARRAY_BUFFER, mime: 'abc/xyz', paramMap: null }, `data:abc/xyz;base64,${encodeBase64(SAMPLE_ARRAY_BUFFER)}` ],
  [ 'String with paramMap', { value: 'string', mime: '', paramMap: { a: '1', b: '2' } }, 'data:a=1;b=2,string' ],
  [ 'ArrayBuffer with paramMap', { value: SAMPLE_ARRAY_BUFFER, mime: '', paramMap: { a: '1', b: '2' } }, `data:a=1;b=2;base64,${encodeBase64(SAMPLE_ARRAY_BUFFER)}` ]
]

describe('Common.Data.Base64', () => {
  it('encode()', () => {
    for (const [ note, source, dataUri ] of SAMPLE_LIST) {
      stringifyEqual(
        encode(source),
        dataUri,
        `should encode: ${note}`
      )
    }
  })

  it('decode()', () => {
    for (const [ note, source, dataUri ] of SAMPLE_LIST) {
      const output = decode(dataUri)
      stringifyEqual(
        decode(dataUri),
        source,
        `should decode: ${note}`
      )
      output.value instanceof ArrayBuffer && stringifyEqual(isEqualArrayBuffer(
        output.value,
        source.value
      ), true, `should decode ArrayBuffer: ${note}`)
    }
  })
})
