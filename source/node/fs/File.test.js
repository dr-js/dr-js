import { resolve } from 'path'
import { stringifyEqual } from 'source/common/verify.js'
import { withRetryAsync } from 'source/common/function.js'
import { deleteDirectory, resetDirectory } from './Directory.js'

import {
  writeText,
  readJSONAlike, readText
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
  it('readJSONAlike()', async () => {
    const SOURCE_FILE = resolve(TEST_ROOT, './json-alike.js')
    await writeText(SOURCE_FILE, 'module.exports = { a: 1 }')
    info(await readText(SOURCE_FILE))
    stringifyEqual(readJSONAlike(SOURCE_FILE), { a: 1 })

    await withRetryAsync(async () => { // TODO: flaky test with babel transpile
      await writeText(SOURCE_FILE, 'module.exports = { b: 2 }')
      info(await readText(SOURCE_FILE))
      stringifyEqual(readJSONAlike(SOURCE_FILE), { b: 2 })
    }, 3)
  })
})
