import { resolve, basename } from 'path'
import { strictEqual } from 'source/common/verify.js'
import { run } from 'source/node/run.js'
import { fromRoot, setupRoot, clearRoot, SOURCE_DIRECTORY, verifyOutputDirectory } from './archive.test/function.js'

import {
  check, verify,
  compressArgs, extractArgs
} from './7z.js'

const { describe, it, before, after, info = console.log } = globalThis

const TEST_TEMP = fromRoot(`test-${basename(__filename)}`)
const fromTemp = (...args) => resolve(TEST_TEMP, ...args)

before(setupRoot)
after(clearRoot)

describe('Node.Module.Archive.7z', () => {
  it('check()', () => strictEqual(check(), true))
  it('verify()', verify)

  it('compressArgs() & extractArgs()', async () => {
    info('compressArgs')
    await Promise.all([
      run(compressArgs(SOURCE_DIRECTORY, fromTemp('compressArgs/test.7z'))).promise,
      run(compressArgs(SOURCE_DIRECTORY, fromTemp('compressArgs/test.zip'))).promise
    ])
    info('extractArgs')
    await Promise.all([
      run(extractArgs(fromTemp('compressArgs/test.7z'), fromTemp('extractArgs/test.7z-extract/'))).promise,
      run(extractArgs(fromTemp('compressArgs/test.zip'), fromTemp('extractArgs/test.zip-extract/'))).promise
    ])
    info('verifyOutputDirectory')
    await verifyOutputDirectory(fromTemp('extractArgs/test.7z-extract/'))
    await verifyOutputDirectory(fromTemp('extractArgs/test.zip-extract/'))
  })
})
