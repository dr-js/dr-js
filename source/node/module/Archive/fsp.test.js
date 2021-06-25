import { resolve, basename } from 'path'
import { createDirectory } from 'source/node/file/Directory.js'

import {
  fromRoot, setupRoot, clearRoot,
  SOURCE_DIRECTORY,
  verifyOutputDirectory
} from './archive.test/function.js'

import {
  compressAsync, extractAsync
} from './fsp.js'

const { describe, it, before, after, info = console.log } = global

const TEST_TEMP = fromRoot(`test-${basename(__filename)}`)
const fromTemp = (...args) => resolve(TEST_TEMP, ...args)

before(async () => setupRoot('skip-mode-600'))
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
    await verifyOutputDirectory(fromTemp('extractAsync/test.fsp-extract/'), 'skip-mode-600')
    await verifyOutputDirectory(fromTemp('extractAsync/test.fsp.gz-extract/'), 'skip-mode-600')
    await verifyOutputDirectory(fromTemp('extractAsync/test.fsp.br-extract/'), 'skip-mode-600')
  })
})
