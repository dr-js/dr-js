import { resolve, basename } from 'path'
import { createReadStream, createWriteStream } from 'fs'
import { doThrowAsync, truthy } from 'source/common/verify.js'
import { quickRunletFromStream } from 'source/node/data/Stream.js'
import { createDirectory } from 'source/node/fs/Directory.js'
import { fromRoot, setupRoot, clearRoot, SOURCE_DIRECTORY, verifyOutputDirectory } from './archive.test/function.js'

import {
  getNpmTar, check, verify,
  createCompressStream, createExtractStream,
  compressAsync, extractAsync
} from './npmTar.js'

const { describe, it, before, after, info = console.log } = globalThis

const TEST_TEMP = fromRoot(`test-${basename(__filename)}`)
const fromTemp = (...args) => resolve(TEST_TEMP, ...args)

before(setupRoot)
after(clearRoot)

describe('Node.Module.Archive.NpmTar', () => {
  it('getNpmTar()', () => truthy(Boolean(getNpmTar())))
  it('check()', () => truthy(check()))
  it('verify()', verify)

  it('createCompressStream() & createExtractStream()', async () => {
    info('createCompressStream')
    await createDirectory(fromTemp('createCompressStream/'))
    await quickRunletFromStream(
      createCompressStream(SOURCE_DIRECTORY),
      createWriteStream(fromTemp('createCompressStream/test.tgz'))
    )
    await quickRunletFromStream(
      createCompressStream(SOURCE_DIRECTORY, { gzip: false }),
      createWriteStream(fromTemp('createCompressStream/test.tar'))
    )
    info('createExtractStream')
    await createDirectory(fromTemp('createExtractStream/test.tgz-extract/'))
    await createDirectory(fromTemp('createExtractStream/test.tar-extract/'))
    await quickRunletFromStream(
      createReadStream(fromTemp('createCompressStream/test.tgz')),
      createExtractStream(fromTemp('createExtractStream/test.tgz-extract/'))
    )
    await quickRunletFromStream(
      createReadStream(fromTemp('createCompressStream/test.tar')),
      createExtractStream(fromTemp('createExtractStream/test.tar-extract/'))
    )
    info('verifyOutputDirectory')
    await verifyOutputDirectory(fromTemp('createExtractStream/test.tgz-extract/'))
    await verifyOutputDirectory(fromTemp('createExtractStream/test.tar-extract/'))
  })

  it('compressAsync() & extractAsync()', async () => {
    info('compressAsync')
    await createDirectory(fromTemp('compressAsync/'))
    await compressAsync(SOURCE_DIRECTORY, fromTemp('compressAsync/test.tar'))
    await compressAsync(SOURCE_DIRECTORY, fromTemp('compressAsync/test.tgz'))
    await compressAsync(SOURCE_DIRECTORY, fromTemp('compressAsync/test.tar.gz'))
    await compressAsync(SOURCE_DIRECTORY, fromTemp('compressAsync/test.tbr'))
    await compressAsync(SOURCE_DIRECTORY, fromTemp('compressAsync/test.tar.br'))
    info('extractAsync')
    await createDirectory(fromTemp('extractAsync/test.tar-extract/'))
    await createDirectory(fromTemp('extractAsync/test.tgz-extract/'))
    await createDirectory(fromTemp('extractAsync/test.tar.gz-extract/'))
    await createDirectory(fromTemp('extractAsync/test.tbr-extract/'))
    await createDirectory(fromTemp('extractAsync/test.tar.br-extract/'))
    await extractAsync(fromTemp('compressAsync/test.tar'), fromTemp('extractAsync/test.tar-extract/'))
    await extractAsync(fromTemp('compressAsync/test.tgz'), fromTemp('extractAsync/test.tgz-extract/'))
    await extractAsync(fromTemp('compressAsync/test.tar.gz'), fromTemp('extractAsync/test.tar.gz-extract/'))
    await extractAsync(fromTemp('compressAsync/test.tbr'), fromTemp('extractAsync/test.tbr-extract/'))
    await extractAsync(fromTemp('compressAsync/test.tar.br'), fromTemp('extractAsync/test.tar.br-extract/'))
    info('verifyOutputDirectory')
    await verifyOutputDirectory(fromTemp('extractAsync/test.tar-extract/'))
    await verifyOutputDirectory(fromTemp('extractAsync/test.tgz-extract/'))
    await verifyOutputDirectory(fromTemp('extractAsync/test.tar.gz-extract/'))
    await verifyOutputDirectory(fromTemp('extractAsync/test.tbr-extract/'))
    await verifyOutputDirectory(fromTemp('extractAsync/test.tar.br-extract/'))
  })

  it('error handle compressAsync() & extractAsync()', async () => {
    info('prepare')
    await createDirectory(fromTemp('errorHandle/'))
    await compressAsync(SOURCE_DIRECTORY, fromTemp('errorHandle/source.tar'))

    info('error handle compressAsync')
    await doThrowAsync(compressAsync, SOURCE_DIRECTORY, fromTemp('errorHandle/1/2/3/4/5/noop.tar'))
    await doThrowAsync(compressAsync, fromTemp('errorHandle/1/2/3/4/5/noop/'), fromTemp('errorHandle/test.tar'))

    info('error handle extractAsync')
    await doThrowAsync(extractAsync, fromTemp('errorHandle/source.tar'), fromTemp('errorHandle/1/2/3/4/5/noop/'))
    await doThrowAsync(extractAsync, fromTemp('errorHandle/1/2/3/4/5/noop.tar'), fromTemp('errorHandle/'))
  })
})
