import { resolve } from 'path'
import { strictEqual } from 'assert'
import {
  ERROR_STAT,
  FILE_TYPE,
  getPathStat,
  getPathTypeFromStat,
  createDirectory,
  trimDirectory,
  movePath,
  copyPath,
  deletePath
} from './File'

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

describe('Node.File.File', () => {
  it('getPathStat()', async () => {
    strictEqual(getPathTypeFromStat(await getPathStat(SOURCE_FILE)), FILE_TYPE.File)
    strictEqual(getPathTypeFromStat(await getPathStat(SOURCE_DIRECTORY)), FILE_TYPE.Directory)
    strictEqual(getPathTypeFromStat(await getPathStat(SOURCE_DIRECTORY_TRIM)), FILE_TYPE.Directory)
    strictEqual(await getPathStat(invalidPath), ERROR_STAT)
    strictEqual(getPathTypeFromStat(await getPathStat(invalidPath)), FILE_TYPE.Error)
  })

  it('createDirectory()', async () => {
    await createDirectory(directoryPath2)
    await createDirectory(directoryPath0)
    await createDirectory(directoryPath1)
    strictEqual(getPathTypeFromStat(await getPathStat(directoryPath0)), FILE_TYPE.Directory)
    strictEqual(getPathTypeFromStat(await getPathStat(directoryPath1)), FILE_TYPE.Directory)
    strictEqual(getPathTypeFromStat(await getPathStat(directoryPath2)), FILE_TYPE.Directory)

    let getExpectedError = false
    try { await createDirectory(SOURCE_FILE) } catch (error) { getExpectedError = true }
    strictEqual(getExpectedError, true)
  })

  it('trimDirectory()', async () => {
    await createDirectory(directoryPath2)

    await trimDirectory(directoryPath0) // non-empty, should give up
    await trimDirectory(directoryPath1) // non-empty, should give up
    strictEqual(getPathTypeFromStat(await getPathStat(directoryPath2)), FILE_TYPE.Directory)

    await trimDirectory(directoryPath2)

    strictEqual(getPathTypeFromStat(await getPathStat(directoryPath0)), FILE_TYPE.Error)
    strictEqual(getPathTypeFromStat(await getPathStat(directoryPath1)), FILE_TYPE.Error)
    strictEqual(getPathTypeFromStat(await getPathStat(directoryPath2)), FILE_TYPE.Error)

    let getExpectedError = false
    try { await trimDirectory(SOURCE_FILE) } catch (error) { getExpectedError = true }
    strictEqual(getExpectedError, true)

    await createDirectory(TEST_ROOT)
  })

  it('copyPath()', async () => {
    await createDirectory(directoryPath2)

    await copyPath(SOURCE_FILE, filePath0)
    strictEqual(getPathTypeFromStat(await getPathStat(filePath0)), FILE_TYPE.File)

    let getExpectedError = false
    try { await copyPath(TEST_ROOT, invalidPath) } catch (error) { getExpectedError = true }
    strictEqual(getExpectedError, true)

    await copyPath(SOURCE_FILE, filePath1)
    await copyPath(SOURCE_FILE, filePath1)

    await copyPath(directoryPath2, directoryPath3)
    await copyPath(directoryPath2, directoryPath3)

    strictEqual(getPathTypeFromStat(await getPathStat(filePath1)), FILE_TYPE.File)
    strictEqual(getPathTypeFromStat(await getPathStat(directoryPath3)), FILE_TYPE.Directory)
  })

  it('movePath()', async () => {
    let getExpectedError = false
    try { await movePath(invalidPath, TEST_ROOT) } catch (error) { getExpectedError = true }
    strictEqual(getExpectedError, true)

    await movePath(filePath1, filePath2)
    await movePath(directoryPath3, directoryPath4)

    strictEqual(await getPathStat(filePath1), ERROR_STAT)
    strictEqual(await getPathStat(directoryPath3), ERROR_STAT)
    strictEqual(getPathTypeFromStat(await getPathStat(filePath2)), FILE_TYPE.File)
    strictEqual(getPathTypeFromStat(await getPathStat(directoryPath4)), FILE_TYPE.Directory)
  })

  it('deletePath()', async () => {
    let getExpectedError = false
    try { await deletePath(TEST_ROOT) } catch (error) { getExpectedError = true }
    strictEqual(getExpectedError, true)

    await deletePath(directoryPath2)
    await deletePath(directoryPath1)
    await deletePath(directoryPath0)
    await deletePath(filePath0)

    strictEqual(await getPathStat(filePath0), ERROR_STAT)
  })
})
