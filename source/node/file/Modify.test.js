import { strictEqual } from 'assert'
import { resolve } from 'path'
import { ERROR_STAT, FILE_TYPE, getPathStat, getPathTypeFromStat, createDirectory } from './File'
import {
  move,
  copyFile,
  deleteFile,
  copyDirectory,
  deleteDirectory
} from './Modify'

const { describe, it, before, after } = global

const TEST_ROOT = resolve(__dirname, './test-modify-gitignore/')
const SOURCE_FILE = resolve(__dirname, './function.js')
const SOURCE_DIRECTORY = resolve(__dirname, '../')

const filePath0 = resolve(TEST_ROOT, 'file0.js')
const filePath1 = resolve(TEST_ROOT, 'file1.js')
const filePath2 = resolve(TEST_ROOT, 'file2.js')

const directoryPath0 = resolve(TEST_ROOT, 'directory0/')
const directoryPath1 = resolve(TEST_ROOT, 'directory1/')

before('prepare', async () => {
  await createDirectory(TEST_ROOT)
  await copyFile(SOURCE_FILE, filePath2)
})

after('clear', async () => {
  await deleteDirectory(TEST_ROOT)
})

describe('Node.File.Modify', () => {
  it('copyFile()/move()/delete() File', async () => {
    await copyFile(SOURCE_FILE, filePath0)
    strictEqual(getPathTypeFromStat(await getPathStat(filePath0)), FILE_TYPE.File)

    await move(filePath0, filePath1)
    strictEqual(await getPathStat(filePath0), ERROR_STAT)
    strictEqual(getPathTypeFromStat(await getPathStat(filePath1)), FILE_TYPE.File)

    await deleteFile(filePath1)
    strictEqual(await getPathStat(filePath1), ERROR_STAT)
  })

  it('copyFile()/move()/delete() Directory', async () => {
    await copyFile(SOURCE_DIRECTORY, directoryPath0)
    strictEqual(getPathTypeFromStat(await getPathStat(directoryPath0)), FILE_TYPE.Directory)

    await move(directoryPath0, directoryPath1)
    strictEqual(await getPathStat(directoryPath0), ERROR_STAT)
    strictEqual(getPathTypeFromStat(await getPathStat(directoryPath1)), FILE_TYPE.Directory)

    await deleteFile(directoryPath1)
    strictEqual(await getPathStat(directoryPath1), ERROR_STAT)
  })

  it('copyDirectory()/delete() File', async () => {
    let getExpectedError = false
    try { await copyDirectory(filePath2, filePath0) } catch (error) { getExpectedError = true }
    strictEqual(getExpectedError, true)

    getExpectedError = false
    try { await deleteDirectory(filePath2) } catch (error) { getExpectedError = true }
    strictEqual(getExpectedError, true)
  })

  it('copyDirectory()/move()/delete() Directory', async () => {
    await copyDirectory(SOURCE_DIRECTORY, directoryPath0)
    strictEqual(getPathTypeFromStat(await getPathStat(directoryPath0)), FILE_TYPE.Directory)

    await move(directoryPath0, directoryPath1)
    strictEqual(await getPathStat(directoryPath0), ERROR_STAT)
    strictEqual(getPathTypeFromStat(await getPathStat(directoryPath1)), FILE_TYPE.Directory)

    await deleteDirectory(directoryPath1)
    strictEqual(await getPathStat(directoryPath1), ERROR_STAT)
  })
})
