import { strictEqual, stringifyEqual } from 'source/common/verify'
import { join as joinPath, dirname, resolve } from 'path'
import { getSample } from 'source/common/math/sample'
import { FILE_TYPE, createDirectory, deletePath } from './File'
import {
  getDirectorySubInfoList,
  getDirectoryInfoTree,
  walkDirectoryInfoTree,
  walkDirectoryInfoTreeBottomUp,
  copyDirectoryInfoTree,
  moveDirectoryInfoTree,
  deleteDirectoryInfoTree,
  getFileList
} from './Directory'

const { describe, it, before, after } = global

const TEST_ROOT = resolve(__dirname, './test-directory-gitignore/')
const SOURCE_FILE = resolve(__dirname, './function.js')
const SOURCE_DIRECTORY = resolve(__dirname, '../module/')
const SOURCE_DIRECTORY_UPPER = resolve(__dirname, '../')

const invalidPath = '../../../../../../../../../../../../../../../../../../../../../../../../a/b/c/d/e/f/g'

const directoryPath0 = resolve(TEST_ROOT, 'a/b/c/d/e/')
const directoryPath1 = resolve(TEST_ROOT, '1/2/3/4/5/')
const directoryPath2 = resolve(TEST_ROOT, '1/')
const directoryPath3 = resolve(TEST_ROOT, 'a/')
const directoryPath4 = resolve(TEST_ROOT, 'a0/')
const directoryPath5 = resolve(TEST_ROOT, 'a1/')

before('prepare', async () => {
  await createDirectory(TEST_ROOT)
  await createDirectory(directoryPath0)
  await createDirectory(directoryPath1)
})

after('clear', async () => {
  await deleteDirectoryInfoTree(await getDirectoryInfoTree(TEST_ROOT))
  await deletePath(TEST_ROOT)
})

describe('Node.File.Directory', () => {
  it('getDirectorySubInfoList()', async () => {
    let getExpectedError = false
    try { await getDirectorySubInfoList(invalidPath) } catch (error) { getExpectedError = true }
    strictEqual(getExpectedError, true)

    getExpectedError = false
    try { await getDirectorySubInfoList(SOURCE_FILE) } catch (error) { getExpectedError = true }
    strictEqual(getExpectedError, true)

    await getDirectorySubInfoList(SOURCE_DIRECTORY)
    await getDirectorySubInfoList(SOURCE_DIRECTORY_UPPER)
    await getDirectorySubInfoList(TEST_ROOT)
  })

  it('getDirectoryInfoTree()', async () => {
    let getExpectedError = false
    try { await getDirectoryInfoTree(invalidPath) } catch (error) { getExpectedError = true }
    strictEqual(getExpectedError, true)

    getExpectedError = false
    try { await getDirectoryInfoTree(SOURCE_FILE) } catch (error) { getExpectedError = true }
    strictEqual(getExpectedError, true)

    await getDirectoryInfoTree(SOURCE_DIRECTORY)
    await getDirectoryInfoTree(SOURCE_DIRECTORY_UPPER)
    const infoTree = await getDirectoryInfoTree(TEST_ROOT)

    // console.log(infoTree)

    strictEqual(infoTree.root, TEST_ROOT)
    strictEqual(infoTree.subInfoListMap[ infoTree.root ].length, 2)
    strictEqual(Object.keys(infoTree.subInfoListMap).length, 11)
    stringifyEqual(
      infoTree.subInfoListMap[ infoTree.root ].map(({ type }) => type),
      getSample(() => FILE_TYPE.Directory, infoTree.subInfoListMap[ infoTree.root ].length)
    )
  })

  it('walkDirectoryInfoTree()', async () => {
    let callbackCount = 0
    await walkDirectoryInfoTree(await getDirectoryInfoTree(TEST_ROOT), (info) => {
      // console.log(' - - info', info)
      callbackCount++
    })
    strictEqual(callbackCount, 10)

    const checkNameList = '2345'.split('')
    await walkDirectoryInfoTree(await getDirectoryInfoTree(directoryPath2), (info) => {
      // console.log(' - - info', info)
      strictEqual(info.name, checkNameList.shift())
    })
  })

  it('walkDirectoryInfoTreeBottomUp()', async () => {
    let callbackCount = 0
    await walkDirectoryInfoTreeBottomUp(await getDirectoryInfoTree(TEST_ROOT), (info) => {
      // console.log(' - - info', info)
      callbackCount++
    })
    strictEqual(callbackCount, 10)

    const checkNameList = '2345'.split('')
    await walkDirectoryInfoTreeBottomUp(await getDirectoryInfoTree(directoryPath2), (info) => {
      // console.log(' - - info', info)
      strictEqual(info.name, checkNameList.pop())
    })
  })

  it('copyDirectoryInfoTree()', async () => {
    await copyDirectoryInfoTree(await getDirectoryInfoTree(directoryPath3), directoryPath4)

    let callbackCount = 0
    await walkDirectoryInfoTree(await getDirectoryInfoTree(directoryPath4), (info) => {
      // console.log(' - - info', info)
      callbackCount++
    })
    strictEqual(callbackCount, 4)
  })

  it('moveDirectoryInfoTree()', async () => {
    await moveDirectoryInfoTree(await getDirectoryInfoTree(directoryPath4), directoryPath5)

    let callbackCount = 0
    await walkDirectoryInfoTree(await getDirectoryInfoTree(directoryPath5), (info) => {
      // console.log(' - - info', info)
      callbackCount++
    })
    strictEqual(callbackCount, 4)
  })

  it('deleteDirectoryInfoTree()', async () => {
    await deleteDirectoryInfoTree(await getDirectoryInfoTree(directoryPath5), directoryPath5)

    let callbackCount = 0
    await walkDirectoryInfoTree(await getDirectoryInfoTree(directoryPath5), (info) => {
      // console.log(' - - info', info)
      callbackCount++
    })
    strictEqual(callbackCount, 0)
  })

  describe('getFileList()', () => {
    const LIST_FILE = resolve(__dirname, './function.js')
    const LIST_DIRECTORY = resolve(__dirname, '../')

    const createSuffixFilterFileCollector = (suffix) => (fileList, { path, name }) => name.endsWith(suffix) && fileList.push(path)
    const createPrefixMapperFileCollector = (prefix) => (fileList, { path, name }) => fileList.push([
      path,
      joinPath(dirname(path), prefix + name)
    ])

    it('getFileList() File', async () => {
      const fileList = await getFileList(LIST_FILE)
      strictEqual(fileList.length, 1)
      strictEqual(fileList[ 0 ], LIST_FILE)
    })

    it('getFileList() Directory', async () => {
      const fileList = await getFileList(LIST_DIRECTORY)
      strictEqual(fileList.length >= 2, true)
      strictEqual(fileList.includes(LIST_FILE), true)
    })

    it('getFileList(createSuffixFilterFileCollector) File', async () => {
      const jsFileList = await getFileList(LIST_FILE, createSuffixFilterFileCollector('.js'))
      const abcdefghFileList = await getFileList(LIST_FILE, createSuffixFilterFileCollector('.abcdefgh'))
      strictEqual(jsFileList.length, 1)
      strictEqual(jsFileList[ 0 ], LIST_FILE)
      strictEqual(abcdefghFileList.length, 0)
    })

    it('getFileList(createSuffixFilterFileCollector) Directory', async () => {
      const jsFileList = await getFileList(LIST_DIRECTORY, createSuffixFilterFileCollector('.js'))
      const abcdefghFileList = await getFileList(LIST_DIRECTORY, createSuffixFilterFileCollector('.abcdefgh'))
      strictEqual(jsFileList.length >= 2, true)
      strictEqual(jsFileList.includes(LIST_FILE), true)
      strictEqual(abcdefghFileList.length, 0)
    })

    it('getFileList(createPrefixMapperFileCollector) File', async () => {
      const fileList = await getFileList(LIST_FILE, createPrefixMapperFileCollector('PREFIX-'))
      strictEqual(fileList.length, 1)
      strictEqual(fileList[ 0 ][ 0 ], LIST_FILE)
      strictEqual(fileList[ 0 ][ 1 ].includes('PREFIX-'), true)
    })

    it('getFileList(createPrefixMapperFileCollector) Directory', async () => {
      const fileList = await getFileList(LIST_DIRECTORY, createPrefixMapperFileCollector('PREFIX-'))
      strictEqual(fileList.length >= 2, true)
      strictEqual(fileList.map((v) => v[ 0 ]).includes(LIST_FILE), true)
      strictEqual(fileList.every((v) => v[ 1 ].includes('PREFIX-')), true)
    })
  })
})
