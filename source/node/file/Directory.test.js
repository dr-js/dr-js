import { join as joinPath, dirname, resolve, sep } from 'path'
import { strictEqual, stringifyEqual } from 'source/common/verify'
import { getSample } from 'source/common/math/sample'
import { PATH_TYPE, getPathTypeFromStat, getPathLstat } from './Path'
import {
  // getPathTypeFromDirent,
  getDirInfoList,
  getDirInfoTree,

  walkDirInfoTreeAsync,
  walkDirInfoTreeBottomUpAsync,

  copyDirInfoTree,
  renameDirInfoTree,
  deleteDirInfoTree,

  createDirectory,
  // copyDirectory,
  deleteDirectory,

  getFileList
} from './Directory'

const { describe, it, before, after } = global

const TEST_ROOT = resolve(__dirname, './test-directory-gitignore/') + sep
const SOURCE_FILE = resolve(__dirname, './Directory.js') + sep
const SOURCE_DIRECTORY = resolve(__dirname, '../data/') + sep
const SOURCE_DIRECTORY_UPPER = resolve(__dirname, '../') + sep

const invalidPath = '../../../../../../../../../../../../../../../../../../../../../../../../a/b/c/d/e/f/g'

const directoryPath0 = resolve(TEST_ROOT, 'a/b/c/d/e/') + sep
const directoryPath1 = resolve(TEST_ROOT, '1/2/3/4/5/') + sep
const directoryPath2 = resolve(TEST_ROOT, '1/') + sep

const directoryPathCopy = resolve(TEST_ROOT, 'copy-source/b/c/d/e/') + sep
const directoryPathCopySource = resolve(TEST_ROOT, 'copy-source/') + sep
const directoryPathCopyTarget = resolve(TEST_ROOT, 'copy-target/') + sep

const directoryPathRename = resolve(TEST_ROOT, 'rename-source/b/c/d/e/') + sep
const directoryPathRenameSource = resolve(TEST_ROOT, 'rename-source/') + sep
const directoryPathRenameTarget = resolve(TEST_ROOT, 'rename-target/') + sep

const directoryPathDelete = resolve(TEST_ROOT, 'delete-source/b/c/d/e/') + sep
const directoryPathDeleteSource = resolve(TEST_ROOT, 'delete-source/') + sep

before(async () => {
  await createDirectory(TEST_ROOT)
  await createDirectory(directoryPath0)
  await createDirectory(directoryPath1)
  await createDirectory(directoryPathRename)
  await createDirectory(directoryPathCopy)
  await createDirectory(directoryPathDelete)
})

after(async () => {
  await deleteDirectory(TEST_ROOT)
})

describe('Node.File.Directory', () => {
  it('getDirInfoList()', async () => {
    let getExpectedError = false
    try { await getDirInfoList(invalidPath) } catch (error) { getExpectedError = true }
    strictEqual(getExpectedError, true)

    getExpectedError = false
    try { await getDirInfoList(SOURCE_FILE) } catch (error) { getExpectedError = true }
    strictEqual(getExpectedError, true)

    await getDirInfoList(SOURCE_DIRECTORY)
    await getDirInfoList(SOURCE_DIRECTORY_UPPER)
    await getDirInfoList(TEST_ROOT)
  })

  it('getDirInfoTree()', async () => {
    let getExpectedError = false
    try { await getDirInfoTree(invalidPath) } catch (error) { getExpectedError = true }
    strictEqual(getExpectedError, true)

    getExpectedError = false
    try { await getDirInfoTree(SOURCE_FILE) } catch (error) { getExpectedError = true }
    strictEqual(getExpectedError, true)

    await getDirInfoTree(SOURCE_DIRECTORY)
    await getDirInfoTree(SOURCE_DIRECTORY_UPPER)
    const dirInfoTree = await getDirInfoTree(TEST_ROOT)

    // console.log(dirInfoTree)

    strictEqual(dirInfoTree.root + sep, TEST_ROOT)
    strictEqual(dirInfoTree.dirInfoListMap.get(dirInfoTree.root).length, 5)
    strictEqual(dirInfoTree.dirInfoListMap.size, 26)
    stringifyEqual(
      dirInfoTree.dirInfoListMap.get(dirInfoTree.root).map(({ type }) => type),
      getSample(() => PATH_TYPE.Directory, dirInfoTree.dirInfoListMap.get(dirInfoTree.root).length)
    )
  })

  it('walkDirInfoTreeAsync()', async () => {
    let callbackCount = 0
    await walkDirInfoTreeAsync(await getDirInfoTree(TEST_ROOT), (dirInfo) => {
      // console.log(' - - dirInfo', dirInfo)
      callbackCount++
    })
    strictEqual(callbackCount, 25)

    const checkNameList = '2345'.split('')
    await walkDirInfoTreeAsync(await getDirInfoTree(directoryPath2), (dirInfo) => {
      // console.log(' - - dirInfo', dirInfo)
      strictEqual(dirInfo.name, checkNameList.shift())
    })
  })

  it('walkDirInfoTreeBottomUpAsync()', async () => {
    let callbackCount = 0
    await walkDirInfoTreeBottomUpAsync(await getDirInfoTree(TEST_ROOT), (dirInfo) => {
      // console.log(' - - dirInfo', dirInfo)
      callbackCount++
    })
    strictEqual(callbackCount, 25)

    const checkNameList = '2345'.split('')
    await walkDirInfoTreeBottomUpAsync(await getDirInfoTree(directoryPath2), (dirInfo) => {
      // console.log(' - - dirInfo', dirInfo)
      strictEqual(dirInfo.name, checkNameList.pop())
    })
  })

  it('copyDirInfoTree()', async () => {
    await copyDirInfoTree(await getDirInfoTree(directoryPathCopySource), directoryPathCopyTarget)

    let callbackCount = 0
    await walkDirInfoTreeAsync(await getDirInfoTree(directoryPathCopyTarget), (dirInfo) => {
      // console.log(' - - dirInfo', dirInfo)
      callbackCount++
    })
    strictEqual(callbackCount, 4)
  })

  it('renameDirInfoTree()', async () => {
    await renameDirInfoTree(await getDirInfoTree(directoryPathRenameSource), directoryPathRenameTarget)

    let callbackCount = 0
    await walkDirInfoTreeAsync(await getDirInfoTree(directoryPathRenameTarget), (dirInfo) => {
      // console.log(' - - dirInfo', dirInfo)
      callbackCount++
    })
    strictEqual(callbackCount, 4)
  })

  it('deleteDirInfoTree()', async () => {
    await deleteDirInfoTree(await getDirInfoTree(directoryPathDeleteSource), directoryPathDeleteSource)

    let callbackCount = 0
    await walkDirInfoTreeAsync(await getDirInfoTree(directoryPathDeleteSource), (dirInfo) => {
      // console.log(' - - dirInfo', dirInfo)
      callbackCount++
    })
    strictEqual(callbackCount, 0)
  })

  it('createDirectory()', async () => {
    await createDirectory(directoryPath2)
    await createDirectory(directoryPath0)
    await createDirectory(directoryPath1)
    strictEqual(getPathTypeFromStat(await getPathLstat(directoryPath0)), PATH_TYPE.Directory)
    strictEqual(getPathTypeFromStat(await getPathLstat(directoryPath1)), PATH_TYPE.Directory)
    strictEqual(getPathTypeFromStat(await getPathLstat(directoryPath2)), PATH_TYPE.Directory)

    let getExpectedError = false
    try { await createDirectory(SOURCE_FILE) } catch (error) { getExpectedError = true }
    strictEqual(getExpectedError, true)
  })

  describe('getFileList()', () => {
    const LIST_FILE = resolve(__dirname, './Directory.js')
    const LIST_DIRECTORY = resolve(__dirname, '../')

    const createSuffixFilterFileCollector = (suffix) => (fileList, { path, name }) => { name.endsWith(suffix) && fileList.push(path) }
    const createPrefixMapperFileCollector = (prefix) => (fileList, { path, name }) => {
      fileList.push([ path, joinPath(dirname(path), prefix + name) ])
    }

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
