import { resolve } from 'path'
import { strictEqual, doThrow } from 'source/common/verify'
import { createDirectory } from './Directory'
import {
  STAT_ERROR,
  PATH_TYPE,
  getPathStat,
  getPathTypeFromStat,
  copyPath,
  renamePath,
  deletePath,
  createPathPrefixLock
} from './Path'

const { describe, it, before, after } = global

const TEST_ROOT = resolve(__dirname, './test-file-gitignore/')
const SOURCE_FILE = resolve(__dirname, './function.js')
const SOURCE_DIRECTORY = resolve(__dirname, '../module/')
const SOURCE_DIRECTORY_TRIM = resolve(__dirname, '../module')

const invalidPath = '../../../../../../../../../../../../../../../../../../../../../../../../a/b/c/d/e/f/g'

const filePath0 = resolve(TEST_ROOT, 'file0.js')
const filePath1 = resolve(TEST_ROOT, 'file1.js')
const filePath2 = resolve(TEST_ROOT, 'file2.js')

const directoryPath0 = resolve(TEST_ROOT, 'a/b/c/')
const directoryPath1 = resolve(TEST_ROOT, 'a/b/c/d/')
const directoryPath2 = resolve(TEST_ROOT, 'a/b/c/d/e/')

const directoryPath3 = resolve(TEST_ROOT, 'a/e0/')
const directoryPath4 = resolve(TEST_ROOT, 'a/e1/')

const directoryPath5 = resolve(TEST_ROOT, 'a/b/')
const directoryPath6 = resolve(TEST_ROOT, 'a/')

before('prepare', async () => {
  await createDirectory(TEST_ROOT)
})

after('clear', async () => {
  await deletePath(filePath2)
  await deletePath(directoryPath4)
  await deletePath(directoryPath5)
  await deletePath(directoryPath6)
  await deletePath(TEST_ROOT)
})

describe('Node.File.Path', () => {
  it('getPathStat()', async () => {
    strictEqual(getPathTypeFromStat(await getPathStat(SOURCE_FILE)), PATH_TYPE.File)
    strictEqual(getPathTypeFromStat(await getPathStat(SOURCE_DIRECTORY)), PATH_TYPE.Directory)
    strictEqual(getPathTypeFromStat(await getPathStat(SOURCE_DIRECTORY_TRIM)), PATH_TYPE.Directory)
    strictEqual(await getPathStat(invalidPath), STAT_ERROR)
    strictEqual(getPathTypeFromStat(await getPathStat(invalidPath)), PATH_TYPE.Error)
  })

  it('copyPath()', async () => {
    await createDirectory(directoryPath2)

    await copyPath(SOURCE_FILE, filePath0)
    strictEqual(getPathTypeFromStat(await getPathStat(filePath0)), PATH_TYPE.File)

    let getExpectedError = false
    try { await copyPath(TEST_ROOT, invalidPath) } catch (error) { getExpectedError = true }
    strictEqual(getExpectedError, true)

    await copyPath(SOURCE_FILE, filePath1)
    await copyPath(SOURCE_FILE, filePath1)

    await copyPath(directoryPath2, directoryPath3)
    await copyPath(directoryPath2, directoryPath3)

    strictEqual(getPathTypeFromStat(await getPathStat(filePath1)), PATH_TYPE.File)
    strictEqual(getPathTypeFromStat(await getPathStat(directoryPath3)), PATH_TYPE.Directory)
  })

  it('renamePath()', async () => {
    let getExpectedError = false
    try { await renamePath(invalidPath, TEST_ROOT) } catch (error) { getExpectedError = true }
    strictEqual(getExpectedError, true)

    await renamePath(filePath1, filePath2)
    await renamePath(directoryPath3, directoryPath4)

    strictEqual(await getPathStat(filePath1), STAT_ERROR)
    strictEqual(await getPathStat(directoryPath3), STAT_ERROR)
    strictEqual(getPathTypeFromStat(await getPathStat(filePath2)), PATH_TYPE.File)
    strictEqual(getPathTypeFromStat(await getPathStat(directoryPath4)), PATH_TYPE.Directory)
  })

  it('deletePath()', async () => {
    let getExpectedError = false
    try { await deletePath(TEST_ROOT) } catch (error) { getExpectedError = true }
    strictEqual(getExpectedError, true)

    await deletePath(directoryPath2)
    await deletePath(directoryPath1)
    await deletePath(directoryPath0)
    await deletePath(filePath0)

    strictEqual(await getPathStat(filePath0), STAT_ERROR)
  })

  it('createPathPrefixLock()', () => {
    const checkPath = (getPathFromRoot, rootPath) => {
      const expectedPath = resolve(`${rootPath}/a/b/c`)
      strictEqual(getPathFromRoot('a/b/c'), expectedPath)
      strictEqual(getPathFromRoot('./a/b/c'), expectedPath)
      strictEqual(getPathFromRoot('a/d/../b/c'), expectedPath)
      doThrow(() => getPathFromRoot('..'), `should throw Error for to much '../'`)
      doThrow(() => getPathFromRoot('a/../../b'), `should throw Error for to much '../'`)
    }

    const getPathFromRoot0 = createPathPrefixLock('/root/path/0/')
    const getPathFromRoot1 = createPathPrefixLock('/root/../root/path/./1')
    const getPathFromRoot2 = createPathPrefixLock('/root/path////2')

    checkPath(getPathFromRoot0, '/root/path/0')
    checkPath(getPathFromRoot1, '/root/path/1')
    checkPath(getPathFromRoot2, '/root/path/2')
  })
})