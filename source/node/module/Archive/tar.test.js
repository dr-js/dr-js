import { resolve, basename } from 'path'
import { strictEqual } from 'source/common/verify.js'
import { createDirectory } from 'source/node/fs/Directory.js'
import { run } from 'source/node/run.js'
import { fromRoot, setupRoot, clearRoot, SOURCE_DIRECTORY, verifyOutputDirectory } from './archive.test/function.js'

import {
  check, verify,
  compressArgs, extractArgs
} from './tar.js'

const { describe, it, before, after, info = console.log } = global

const TEST_TEMP = fromRoot(`test-${basename(__filename)}`)
const fromTemp = (...args) => resolve(TEST_TEMP, ...args)

before(setupRoot)
after(clearRoot)

describe('Node.Module.Archive.Tar', () => {
  it('check()', () => strictEqual(check(), true))
  it('verify()', verify)

  it('compressArgs() & extractArgs()', async () => {
    info('compressArgs')
    await createDirectory(fromTemp('compressArgs/'))
    await run(compressArgs(SOURCE_DIRECTORY, fromTemp('compressArgs/test.tar'))).promise
    await run(compressArgs(SOURCE_DIRECTORY, fromTemp('compressArgs/test.tgz'))).promise
    await run(compressArgs(SOURCE_DIRECTORY, fromTemp('compressArgs/test.tar.gz'))).promise
    info('extractArgs')
    await createDirectory(fromTemp('extractArgs/test.tar-extract/'))
    await createDirectory(fromTemp('extractArgs/test.tgz-extract/'))
    await createDirectory(fromTemp('extractArgs/test.tar.gz-extract/'))
    await run(extractArgs(fromTemp('compressArgs/test.tar'), fromTemp('extractArgs/test.tar-extract/'))).promise
    await run(extractArgs(fromTemp('compressArgs/test.tgz'), fromTemp('extractArgs/test.tgz-extract/'))).promise
    await run(extractArgs(fromTemp('compressArgs/test.tar.gz'), fromTemp('extractArgs/test.tar.gz-extract/'))).promise
    info('verifyOutputDirectory')
    await verifyOutputDirectory(fromTemp('extractArgs/test.tar-extract/'))
    await verifyOutputDirectory(fromTemp('extractArgs/test.tgz-extract/'))
    await verifyOutputDirectory(fromTemp('extractArgs/test.tar.gz-extract/'))
  })
})
