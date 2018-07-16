import { resolve } from 'path'
import { equal } from 'assert'
import {
  ERROR_STAT,
  FILE_TYPE,
  getPathStat,
  getPathTypeFromStat,
  createDirectory,
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
    equal(getPathTypeFromStat(await getPathStat(SOURCE_FILE)), FILE_TYPE.File)
    equal(getPathTypeFromStat(await getPathStat(SOURCE_DIRECTORY)), FILE_TYPE.Directory)
    equal(getPathTypeFromStat(await getPathStat(SOURCE_DIRECTORY_TRIM)), FILE_TYPE.Directory)
    equal(await getPathStat(invalidPath), ERROR_STAT)
    equal(getPathTypeFromStat(await getPathStat(invalidPath)), FILE_TYPE.Error)
  })

  it('createDirectory()', async () => {
    await createDirectory(directoryPath2)
    await createDirectory(directoryPath0)
    await createDirectory(directoryPath1)
    equal(getPathTypeFromStat(await getPathStat(directoryPath0)), FILE_TYPE.Directory)
    equal(getPathTypeFromStat(await getPathStat(directoryPath1)), FILE_TYPE.Directory)
    equal(getPathTypeFromStat(await getPathStat(directoryPath2)), FILE_TYPE.Directory)

    let getExpectedError = false
    try { await createDirectory(SOURCE_FILE) } catch (error) { getExpectedError = true }
    equal(getExpectedError, true)
  })

  it('copyPath()', async () => {
    await copyPath(SOURCE_FILE, filePath0)
    equal(getPathTypeFromStat(await getPathStat(filePath0)), FILE_TYPE.File)

    let getExpectedError = false
    try { await copyPath(TEST_ROOT, invalidPath) } catch (error) { getExpectedError = true }
    equal(getExpectedError, true)

    await copyPath(SOURCE_FILE, filePath1)
    await copyPath(SOURCE_FILE, filePath1)

    await copyPath(directoryPath2, directoryPath3)
    await copyPath(directoryPath2, directoryPath3)

    equal(getPathTypeFromStat(await getPathStat(filePath1)), FILE_TYPE.File)
    equal(getPathTypeFromStat(await getPathStat(directoryPath3)), FILE_TYPE.Directory)
  })

  it('movePath()', async () => {
    let getExpectedError = false
    try { await movePath(invalidPath, TEST_ROOT) } catch (error) { getExpectedError = true }
    equal(getExpectedError, true)

    await movePath(filePath1, filePath2)
    await movePath(directoryPath3, directoryPath4)

    equal(await getPathStat(filePath1), ERROR_STAT)
    equal(await getPathStat(directoryPath3), ERROR_STAT)
    equal(getPathTypeFromStat(await getPathStat(filePath2)), FILE_TYPE.File)
    equal(getPathTypeFromStat(await getPathStat(directoryPath4)), FILE_TYPE.Directory)
  })

  it('deletePath()', async () => {
    let getExpectedError = false
    try { await deletePath(TEST_ROOT) } catch (error) { getExpectedError = true }
    equal(getExpectedError, true)

    await deletePath(directoryPath2)
    await deletePath(directoryPath1)
    await deletePath(directoryPath0)
    await deletePath(filePath0)

    equal(await getPathStat(filePath0), ERROR_STAT)
  })
})
