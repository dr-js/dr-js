import { resolve } from 'path'
import { createReadStream, createWriteStream, promises as fsAsync } from 'fs'
import { createGzip } from 'zlib'
import { stringifyEqual } from 'source/common/verify.js'
import { getSampleRange } from 'source/common/math/sample.js'
import { compareString } from 'source/common/compare.js'
import { createDirectory, resetDirectory } from 'source/node/fs/Directory.js'
import { modifyDelete } from 'source/node/fs/Modify.js'
import { quickRunletFromStream } from 'source/node/data/Stream.js'

import {
  TYPE_FILE, TYPE_DIRECTORY, TYPE_SYMLINK,
  initFsPack, saveFsPack, loadFsPack,
  setFsPackPackRoot,
  appendFromPath,
  unpackToPath
} from './FsPack.js'

const { describe, it, before, after, info = console.log } = globalThis

const TEST_ROOT = resolve(__dirname, './test-fs-pack-gitignore/')
const fromRoot = (...args) => resolve(TEST_ROOT, ...args)

before(async () => {
  await resetDirectory(TEST_ROOT)
  await createDirectory(fromRoot('input'))
  await fsAsync.writeFile(fromRoot('input/empty'), '')
  await fsAsync.writeFile(fromRoot('input/text'), 'input/text')
  await fsAsync.writeFile(fromRoot('input/binary-small'), Buffer.from(getSampleRange(0, 64 - 1)))
  await fsAsync.writeFile(fromRoot('input/binary-big'), Buffer.from(getSampleRange(0, 128 * 1024 - 1)))
  await createDirectory(fromRoot('input/dir0'))
  await fsAsync.writeFile(fromRoot('input/dir0/empty'), '')
  await fsAsync.writeFile(fromRoot('input/dir0/text'), 'input/dir0/text')
  await fsAsync.writeFile(fromRoot('input/dir0/binary-small'), Buffer.from(getSampleRange(0, 64 - 1)))
  await fsAsync.writeFile(fromRoot('input/dir0/binary-big'), Buffer.from(getSampleRange(0, 128 * 1024 - 1)))
  await createDirectory(fromRoot('input/dir1'))
  if (process.platform !== 'win32') {
    await createDirectory(fromRoot('input/dir2'))
    await fsAsync.writeFile(fromRoot('input/dir2/file-executable'), 'input/dir2/file-executable', { mode: 0o755 })
    await fsAsync.symlink('relative/path', fromRoot('input/dir2/symlink-relative'))
    await fsAsync.symlink('/absolute/path', fromRoot('input/dir2/symlink-absolute'))
  }
})
after(async () => {
  await modifyDelete(TEST_ROOT)
})

const HEADER_JSON_INPUT = {
  contentList: [
    { type: TYPE_FILE, route: 'input/binary-big', size: 131072, isExecutable: false },
    { type: TYPE_FILE, route: 'input/binary-small', size: 64, isExecutable: false },
    { type: TYPE_FILE, route: 'input/empty', size: 0, isExecutable: false },
    { type: TYPE_FILE, route: 'input/text', size: 10, isExecutable: false },
    { type: TYPE_FILE, route: 'input/dir0/binary-big', size: 131072, isExecutable: false },
    { type: TYPE_FILE, route: 'input/dir0/binary-small', size: 64, isExecutable: false },
    { type: TYPE_FILE, route: 'input/dir0/empty', size: 0, isExecutable: false },
    { type: TYPE_FILE, route: 'input/dir0/text', size: 15, isExecutable: false },
    { type: TYPE_DIRECTORY, route: 'input/dir1' },
    ...(process.platform !== 'win32' ? [
      { type: TYPE_FILE, route: 'input/dir2/file-executable', size: 26, isExecutable: true },
      { type: TYPE_SYMLINK, route: 'input/dir2/symlink-relative', target: 'relative/path' },
      { type: TYPE_SYMLINK, route: 'input/dir2/symlink-absolute', target: '/absolute/path' }
    ] : [])
  ]
}

const HEADER_JSON_INPUT_ROOT = {
  contentList: [
    { type: TYPE_FILE, route: 'binary-big', size: 131072, isExecutable: false },
    { type: TYPE_FILE, route: 'binary-small', size: 64, isExecutable: false },
    { type: TYPE_FILE, route: 'empty', size: 0, isExecutable: false },
    { type: TYPE_FILE, route: 'text', size: 10, isExecutable: false },
    { type: TYPE_FILE, route: 'dir0/binary-big', size: 131072, isExecutable: false },
    { type: TYPE_FILE, route: 'dir0/binary-small', size: 64, isExecutable: false },
    { type: TYPE_FILE, route: 'dir0/empty', size: 0, isExecutable: false },
    { type: TYPE_FILE, route: 'dir0/text', size: 15, isExecutable: false },
    { type: TYPE_DIRECTORY, route: 'dir1' },
    ...(process.platform !== 'win32' ? [
      { type: TYPE_FILE, route: 'dir2/file-executable', size: 26, isExecutable: true },
      { type: TYPE_SYMLINK, route: 'dir2/symlink-relative', target: 'relative/path' },
      { type: TYPE_SYMLINK, route: 'dir2/symlink-absolute', target: '/absolute/path' }
    ] : [])
  ]
}

const sortHeaderJSON = (headerJSON) => {
  headerJSON.contentList.sort((a, b) => compareString(a.route, b.route))
  return headerJSON
}

describe('Node.Module.FsPack', () => {
  it('initFsPack()', async () => {
    const fsPack = await initFsPack({ packPath: fromRoot('test-initFsPack.fsp') })
    info(JSON.stringify(fsPack.headerJSON))
    stringifyEqual(fsPack.headerJSON, { contentList: [] })
  })

  it('saveFsPack()', async () => {
    const fsPack = await initFsPack({ packPath: fromRoot('test-saveFsPack.fsp') })
    await saveFsPack(fsPack)
    stringifyEqual(fsPack.headerJSON, { contentList: [] })
  })

  it('loadFsPack()', async () => {
    const fsPack = await initFsPack({ packPath: fromRoot('test-saveFsPack.fsp') })
    await saveFsPack(fsPack)
    const loadedFsPack = await loadFsPack(fsPack)
    info(JSON.stringify(loadedFsPack.headerJSON))
    stringifyEqual(loadedFsPack.headerJSON, fsPack.headerJSON)
  })

  it('appendFromPath()', async () => {
    const fsPack = await initFsPack({ packPath: fromRoot('test-appendFromPath.fsp') })
    await appendFromPath(fsPack, fromRoot('input'))
    await saveFsPack(fsPack)
    stringifyEqual(sortHeaderJSON(fsPack.headerJSON), sortHeaderJSON(HEADER_JSON_INPUT))
  })

  it('setFsPackPackRoot()', async () => {
    const fsPack = await initFsPack({ packPath: fromRoot('test-setFsPackPackRoot.fsp') })
    setFsPackPackRoot(fsPack, fromRoot('input'))
    await appendFromPath(fsPack, fromRoot('input'))
    await saveFsPack(fsPack)
    stringifyEqual(sortHeaderJSON(fsPack.headerJSON), sortHeaderJSON(HEADER_JSON_INPUT_ROOT))
  })

  it('unpackToPath()', async () => {
    const fsPack = await initFsPack({ packPath: fromRoot('test-unpackToPath.fsp') })
    setFsPackPackRoot(fsPack, fromRoot('input'))
    await appendFromPath(fsPack, fromRoot('input'))
    await saveFsPack(fsPack)

    const loadedFsPack = await loadFsPack(fsPack)
    await unpackToPath(loadedFsPack, fromRoot('test-unpack'))
    stringifyEqual(sortHeaderJSON(loadedFsPack.headerJSON), sortHeaderJSON(HEADER_JSON_INPUT_ROOT))
  })

  it('stressSmall', async () => {
    const fsPack = await initFsPack({ packPath: fromRoot('test-stressSmall.fsp') })
    setFsPackPackRoot(fsPack, fromRoot('../../server'))
    await appendFromPath(fsPack, fromRoot('../../server'))
    await saveFsPack(fsPack)

    const loadedFsPack = await loadFsPack(fsPack)
    await unpackToPath(loadedFsPack, fromRoot('test-stressSmall'))

    await quickRunletFromStream(
      createReadStream(fromRoot('test-stressSmall.fsp')),
      createGzip(),
      createWriteStream(fromRoot('test-stressSmall.fsp.gz'))
    )
    // console.log('==========================================')
    // console.log(JSON.stringify(sortHeaderJSON(loadedFsPack.headerJSON)))
  })

  __DEV__ && it('stressLarge', async () => {
    const fsPack = await initFsPack({ packPath: fromRoot('test-stressLarge.fsp') })
    setFsPackPackRoot(fsPack, fromRoot('../../../../node_modules'))
    await appendFromPath(fsPack, fromRoot('../../../../node_modules'))
    await saveFsPack(fsPack)

    const loadedFsPack = await loadFsPack(fsPack)
    await unpackToPath(loadedFsPack, fromRoot('test-stressLarge'))

    await quickRunletFromStream( // this is smaller than normal zip
      createReadStream(fromRoot('test-stressLarge.fsp')),
      createGzip(),
      createWriteStream(fromRoot('test-stressLarge.fsp.gz'))
    )
    // console.log('==========================================')
    // console.log(JSON.stringify(sortHeaderJSON(loadedFsPack.headerJSON))) // NOTE: very long
  })
})
