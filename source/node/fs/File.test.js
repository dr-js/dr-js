import { resolve } from 'node:path'
import { stringifyEqual, truthy } from 'source/common/verify.js'
import { withRetryAsync } from 'source/common/function.js'
import { isEqualArrayBuffer } from 'source/common/data/ArrayBuffer.js'
import { deleteDirectory, resetDirectory } from './Directory.js'

import {
  writeText,
  writeArrayBuffer, readArrayBuffer,
  readJSONAlikeSync, readText
} from './File.js'

const { describe, it, before, after, info = console.log } = globalThis

const TEST_ROOT = resolve(__dirname, './test-file-gitignore/')

before(async () => {
  await resetDirectory(TEST_ROOT)
})

after(async () => {
  await deleteDirectory(TEST_ROOT)
})

describe('Node.Fs.File', () => {
  it('writeArrayBuffer()', async () => {
    const SOURCE_FILE = resolve(TEST_ROOT, './array-buffer.file')
    const SOURCE_ARRAY_BUFFER = await readArrayBuffer(resolve(__filename))
    await writeArrayBuffer(SOURCE_FILE, SOURCE_ARRAY_BUFFER)
    truthy(isEqualArrayBuffer(await readArrayBuffer(SOURCE_FILE), SOURCE_ARRAY_BUFFER))
  })
  it('readJSONAlikeSync()', async () => {
    const SOURCE_FILE = resolve(TEST_ROOT, './json-alike.js')
    await writeText(SOURCE_FILE, 'module.exports = { a: 1 }')
    info(await readText(SOURCE_FILE))
    stringifyEqual(readJSONAlikeSync(SOURCE_FILE), { a: 1 })

    await withRetryAsync(async () => { // TODO: flaky test with babel transpile
      await writeText(SOURCE_FILE, 'module.exports = { b: 2 }')
      info(await readText(SOURCE_FILE))
      stringifyEqual(readJSONAlikeSync(SOURCE_FILE), { b: 2 })
    }, 6)
  })
})
