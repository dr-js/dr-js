import { equal, deepEqual } from 'assert'
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
    equal(getExpectedError, true)

    getExpectedError = false
    try { await getDirectorySubInfoList(SOURCE_FILE) } catch (error) { getExpectedError = true }
    equal(getExpectedError, true)

    await getDirectorySubInfoList(SOURCE_DIRECTORY)
    await getDirectorySubInfoList(SOURCE_DIRECTORY_UPPER)
    await getDirectorySubInfoList(TEST_ROOT)
  })

  it('getDirectoryInfoTree()', async () => {
    let getExpectedError = false
    try { await getDirectoryInfoTree(invalidPath) } catch (error) { getExpectedError = true }
    equal(getExpectedError, true)

    getExpectedError = false
    try { await getDirectoryInfoTree(SOURCE_FILE) } catch (error) { getExpectedError = true }
    equal(getExpectedError, true)

    await getDirectoryInfoTree(SOURCE_DIRECTORY)
    await getDirectoryInfoTree(SOURCE_DIRECTORY_UPPER)
    const infoTree = await getDirectoryInfoTree(TEST_ROOT)

    // console.log(infoTree)

    equal(infoTree.root, TEST_ROOT)
    equal(infoTree.subInfoListMap[ infoTree.root ].length, 2)
    equal(Object.keys(infoTree.subInfoListMap).length, 11)
    deepEqual(
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
    equal(callbackCount, 10)

    const checkNameList = '2345'.split('')
    await walkDirectoryInfoTree(await getDirectoryInfoTree(directoryPath2), (info) => {
      // console.log(' - - info', info)
      equal(info.name, checkNameList.shift())
    })
  })

  it('walkDirectoryInfoTreeBottomUp()', async () => {
    let callbackCount = 0
    await walkDirectoryInfoTreeBottomUp(await getDirectoryInfoTree(TEST_ROOT), (info) => {
      // console.log(' - - info', info)
      callbackCount++
    })
    equal(callbackCount, 10)

    const checkNameList = '2345'.split('')
    await walkDirectoryInfoTreeBottomUp(await getDirectoryInfoTree(directoryPath2), (info) => {
      // console.log(' - - info', info)
      equal(info.name, checkNameList.pop())
    })
  })

  it('copyDirectoryInfoTree()', async () => {
    await copyDirectoryInfoTree(await getDirectoryInfoTree(directoryPath3), directoryPath4)

    let callbackCount = 0
    await walkDirectoryInfoTree(await getDirectoryInfoTree(directoryPath4), (info) => {
      // console.log(' - - info', info)
      callbackCount++
    })
    equal(callbackCount, 4)
  })

  it('moveDirectoryInfoTree()', async () => {
    await moveDirectoryInfoTree(await getDirectoryInfoTree(directoryPath4), directoryPath5)

    let callbackCount = 0
    await walkDirectoryInfoTree(await getDirectoryInfoTree(directoryPath5), (info) => {
      // console.log(' - - info', info)
      callbackCount++
    })
    equal(callbackCount, 4)
  })

  it('deleteDirectoryInfoTree()', async () => {
    await deleteDirectoryInfoTree(await getDirectoryInfoTree(directoryPath5), directoryPath5)

    let callbackCount = 0
    await walkDirectoryInfoTree(await getDirectoryInfoTree(directoryPath5), (info) => {
      // console.log(' - - info', info)
      callbackCount++
    })
    equal(callbackCount, 0)
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
      equal(fileList.length, 1)
      equal(fileList[ 0 ], LIST_FILE)
    })

    it('getFileList() Directory', async () => {
      const fileList = await getFileList(LIST_DIRECTORY)
      equal(fileList.length >= 2, true)
      equal(fileList.includes(LIST_FILE), true)
    })

    it('getFileList(createSuffixFilterFileCollector) File', async () => {
      const jsFileList = await getFileList(LIST_FILE, createSuffixFilterFileCollector('.js'))
      const abcdefghFileList = await getFileList(LIST_FILE, createSuffixFilterFileCollector('.abcdefgh'))
      equal(jsFileList.length, 1)
      equal(jsFileList[ 0 ], LIST_FILE)
      equal(abcdefghFileList.length, 0)
    })

    it('getFileList(createSuffixFilterFileCollector) Directory', async () => {
      const jsFileList = await getFileList(LIST_DIRECTORY, createSuffixFilterFileCollector('.js'))
      const abcdefghFileList = await getFileList(LIST_DIRECTORY, createSuffixFilterFileCollector('.abcdefgh'))
      equal(jsFileList.length >= 2, true)
      equal(jsFileList.includes(LIST_FILE), true)
      equal(abcdefghFileList.length, 0)
    })

    it('getFileList(createPrefixMapperFileCollector) File', async () => {
      const fileList = await getFileList(LIST_FILE, createPrefixMapperFileCollector('PREFIX-'))
      equal(fileList.length, 1)
      equal(fileList[ 0 ][ 0 ], LIST_FILE)
      equal(fileList[ 0 ][ 1 ].includes('PREFIX-'), true)
    })

    it('getFileList(createPrefixMapperFileCollector) Directory', async () => {
      const fileList = await getFileList(LIST_DIRECTORY, createPrefixMapperFileCollector('PREFIX-'))
      equal(fileList.length >= 2, true)
      equal(fileList.map((v) => v[ 0 ]).includes(LIST_FILE), true)
      equal(fileList.every((v) => v[ 1 ].includes('PREFIX-')), true)
    })
  })
})
