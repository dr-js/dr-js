import { strictEqual } from 'source/common/verify.js'
import { isEqualArrayBuffer } from 'source/common/data/ArrayBuffer.js'

import {
  Blob,
  parseBlobAsText,
  parseBlobAsDataURL,
  parseBlobAsArrayBuffer
} from './Blob.js'

const { describe, it } = global
const { btoa } = window

const TEST_TEXT = '123 abc !@#'
const TEST_TYPE = 'text/test'
const TEST_BLOB = new Blob([ TEST_TEXT ], { type: TEST_TYPE })

describe('Browser.Data.Blob', () => {
  it('parseBlobAsText()', async () => {
    strictEqual(
      await parseBlobAsText(TEST_BLOB),
      TEST_TEXT
    )
  })

  it('parseBlobAsDataURL()', async () => {
    strictEqual(
      await parseBlobAsDataURL(TEST_BLOB),
      `data:${TEST_TYPE};base64,${btoa('123 abc !@#')}`
    )
  })

  it('parseBlobAsArrayBuffer()', async () => {
    strictEqual(
      isEqualArrayBuffer(
        await parseBlobAsArrayBuffer(TEST_BLOB),
        new TextEncoder().encode('123 abc !@#').buffer
      ),
      true
    )
  })
})
