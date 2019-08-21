import { strictEqual, stringifyEqual } from 'source/common/verify'
import { join as joinPath, dirname, resolve } from 'path'
import { getSample } from 'source/common/math/sample'
import { PATH_TYPE, getPathStat, getPathTypeFromStat, deletePath } from './Path'
import {
  getDirectorySubInfoList,
  getDirectoryInfoTree,

  walkDirectoryInfoTree,
  walkDirectoryInfoTreeBottomUp,

  moveDirectoryInfoTree,
  copyDirectoryInfoTree,
  deleteDirectoryInfoTree,

  createDirectory,

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

const directoryPathMove = resolve(TEST_ROOT, 'move-source/b/c/d/e/')
const directoryPathMoveSource = resolve(TEST_ROOT, 'move-source/')
const directoryPathMoveTarget = resolve(TEST_ROOT, 'move-target/')

const directoryPathCopy = resolve(TEST_ROOT, 'copy-source/b/c/d/e/')
const directoryPathCopySource = resolve(TEST_ROOT, 'copy-source/')
const directoryPathCopyTarget = resolve(TEST_ROOT, 'copy-target/')

const directoryPathDelete = resolve(TEST_ROOT, 'delete-source/b/c/d/e/')
const directoryPathDeleteSource = resolve(TEST_ROOT, 'delete-source/')

before('prepare', async () => {
  await createDirectory(TEST_ROOT)
  await createDirectory(directoryPath0)
  await createDirectory(directoryPath1)
  await createDirectory(directoryPathMove)
  await createDirectory(directoryPathCopy)
  await createDirectory(directoryPathDelete)
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
    strictEqual(infoTree.subInfoListMap[ infoTree.root ].length, 5)
    strictEqual(Object.keys(infoTree.subInfoListMap).length, 26)
    stringifyEqual(
      infoTree.subInfoListMap[ infoTree.root ].map(({ type }) => type),
      getSample(() => PATH_TYPE.Directory, infoTree.subInfoListMap[ infoTree.root ].length)
    )
  })

  it('walkDirectoryInfoTree()', async () => {
    let callbackCount = 0
    await walkDirectoryInfoTree(await getDirectoryInfoTree(TEST_ROOT), (info) => {
      // console.log(' - - info', info)
      callbackCount++
    })
    strictEqual(callbackCount, 25)

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
    strictEqual(callbackCount, 25)

    const checkNameList = '2345'.split('')
    await walkDirectoryInfoTreeBottomUp(await getDirectoryInfoTree(directoryPath2), (info) => {
      // console.log(' - - info', info)
      strictEqual(info.name, checkNameList.pop())
    })
  })

  it('moveDirectoryInfoTree()', async () => {
    await moveDirectoryInfoTree(await getDirectoryInfoTree(directoryPathMoveSource), directoryPathMoveTarget)

    let callbackCount = 0
    await walkDirectoryInfoTree(await getDirectoryInfoTree(directoryPathMoveTarget), (info) => {
      // console.log(' - - info', info)
      callbackCount++
    })
    strictEqual(callbackCount, 4)
  })

  it('copyDirectoryInfoTree()', async () => {
    await copyDirectoryInfoTree(await getDirectoryInfoTree(directoryPathCopySource), directoryPathCopyTarget)

    let callbackCount = 0
    await walkDirectoryInfoTree(await getDirectoryInfoTree(directoryPathCopyTarget), (info) => {
      // console.log(' - - info', info)
      callbackCount++
    })
    strictEqual(callbackCount, 4)
  })

  it('deleteDirectoryInfoTree()', async () => {
    await deleteDirectoryInfoTree(await getDirectoryInfoTree(directoryPathDeleteSource), directoryPathDeleteSource)

    let callbackCount = 0
    await walkDirectoryInfoTree(await getDirectoryInfoTree(directoryPathDeleteSource), (info) => {
      // console.log(' - - info', info)
      callbackCount++
    })
    strictEqual(callbackCount, 0)
  })

  it('createDirectory()', async () => {
    await createDirectory(directoryPath2)
    await createDirectory(directoryPath0)
    await createDirectory(directoryPath1)
    strictEqual(getPathTypeFromStat(await getPathStat(directoryPath0)), PATH_TYPE.Directory)
    strictEqual(getPathTypeFromStat(await getPathStat(directoryPath1)), PATH_TYPE.Directory)
    strictEqual(getPathTypeFromStat(await getPathStat(directoryPath2)), PATH_TYPE.Directory)

    let getExpectedError = false
    try { await createDirectory(SOURCE_FILE) } catch (error) { getExpectedError = true }
    strictEqual(getExpectedError, true)
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
