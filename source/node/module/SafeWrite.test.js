import { resolve } from 'path'
import { readFileSync } from 'fs'
import { strictEqual } from 'source/common/verify.js'
import { setTimeoutAsync } from 'source/common/time.js'
import { resetDirectory } from 'source/node/fs/Directory.js'
import { modifyDelete } from 'source/node/fs/Modify.js'

import { createSafeWriteStream } from './SafeWrite.js'

const { describe, it, before, after } = global

const TEST_ROOT = resolve(__dirname, './test-safe-write-gitignore/')

before(() => resetDirectory(TEST_ROOT))
after(() => modifyDelete(TEST_ROOT))

describe('Node.Module.SafeWrite', () => { // TODO: flaky test
  it('createSafeWriteStream() sync write', () => {
    const pathOutputFile = resolve(TEST_ROOT, 'log0')
    const { write, end } = createSafeWriteStream({ pathOutputFile })
    write('1')
    write('2')
    write('3')
    write('4')
    write('5')
    end()
    strictEqual(readFileSync(pathOutputFile, 'utf8'), '12345')
  })

  it('createSafeWriteStream() async write 1', async () => {
    const pathOutputFile = resolve(TEST_ROOT, 'log1')
    const { write, end } = createSafeWriteStream({ pathOutputFile })
    write('1')
    await setTimeoutAsync(10)
    write('2')
    await setTimeoutAsync(10)
    write('3')
    await setTimeoutAsync(10)
    write('4')
    await setTimeoutAsync(10)
    write('5')
    end()
    await setTimeoutAsync(10)
    strictEqual(readFileSync(pathOutputFile, 'utf8'), '12345')
  })

  it('createSafeWriteStream() async write 2', async () => {
    const pathOutputFile = resolve(TEST_ROOT, 'log2')
    const { write, end } = createSafeWriteStream({ pathOutputFile })
    write('1')
    await setTimeoutAsync(10)
    write('2')
    await setTimeoutAsync(10)
    write('3')
    await setTimeoutAsync(10)
    write('4')
    await setTimeoutAsync(10)
    write('5')
    end()
    strictEqual(readFileSync(pathOutputFile, 'utf8'), '12345')
  })

  it('createSafeWriteStream() async write 3', async () => {
    const pathOutputFile = resolve(TEST_ROOT, 'log3')
    const { write, end } = createSafeWriteStream({ pathOutputFile })
    write('1')
    write('2')
    await setTimeoutAsync(10)
    write('3')
    write('4')
    write('5')
    await setTimeoutAsync(10)
    end()
    strictEqual(readFileSync(pathOutputFile, 'utf8'), '12345')
  })

  it('createSafeWriteStream() async write 4', async () => {
    const pathOutputFile = resolve(TEST_ROOT, 'log4')
    const { write, end } = createSafeWriteStream({ pathOutputFile })
    await setTimeoutAsync(10)
    write('1')
    write('2')
    write('3')
    write('4')
    write('5')
    end()
    strictEqual(readFileSync(pathOutputFile, 'utf8'), '12345')
  })
})
