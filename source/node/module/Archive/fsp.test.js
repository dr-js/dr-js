import { resolve, basename } from 'node:path'
import { createDirectory } from 'source/node/fs/Directory.js'

import {
  fromRoot, setupRoot, clearRoot,
  SOURCE_DIRECTORY,
  verifyOutputDirectory
} from './archive.test/function.js'

import {
  compressAsync, extractAsync
} from './fsp.js'

const { describe, it, before, after, info = console.log } = globalThis

const TEST_TEMP = fromRoot(`test-${basename(__filename)}`)
const fromTemp = (...args) => resolve(TEST_TEMP, ...args)

before(async () => setupRoot({ isSkipMode600: true }))
after(clearRoot)

describe('Node.Module.Archive.Fsp', () => {
  it('compressAsync() & extractAsync()', async () => {
    info('compressAsync')
    await createDirectory(fromTemp('compressAsync/'))
    await compressAsync(SOURCE_DIRECTORY, fromTemp('compressAsync/test.fsp'))
    await compressAsync(SOURCE_DIRECTORY, fromTemp('compressAsync/test.fsp.gz'))
    await compressAsync(SOURCE_DIRECTORY, fromTemp('compressAsync/test.fsp.br'))
    info('extractAsync')
    await createDirectory(fromTemp('extractAsync/test.fsp-extract/'))
    await createDirectory(fromTemp('extractAsync/test.fsp.gz-extract/'))
    await createDirectory(fromTemp('extractAsync/test.fsp.br-extract/'))
    await extractAsync(fromTemp('compressAsync/test.fsp'), fromTemp('extractAsync/test.fsp-extract/'))
    await extractAsync(fromTemp('compressAsync/test.fsp.gz'), fromTemp('extractAsync/test.fsp.gz-extract/'))
    await extractAsync(fromTemp('compressAsync/test.fsp.br'), fromTemp('extractAsync/test.fsp.br-extract/'))
    info('verifyOutputDirectory')
    await verifyOutputDirectory(fromTemp('extractAsync/test.fsp-extract/'), { isSkipMode600: true })
    await verifyOutputDirectory(fromTemp('extractAsync/test.fsp.gz-extract/'), { isSkipMode600: true })
    await verifyOutputDirectory(fromTemp('extractAsync/test.fsp.br-extract/'), { isSkipMode600: true })
  })
})
