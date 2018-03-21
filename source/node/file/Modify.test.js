import { equal } from 'assert'
import { resolve } from 'path'
import { FILE_TYPE, getPathType, createDirectory } from './File'
import {
  copyFile,
  moveFile,
  deleteFile,
  copyDirectory,
  moveDirectory,
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
    equal(await getPathType(filePath0), FILE_TYPE.File)
    await moveFile(filePath0, filePath1)
    equal(await getPathType(filePath0), FILE_TYPE.Error)
    equal(await getPathType(filePath1), FILE_TYPE.File)
    await deleteFile(filePath1)
    equal(await getPathType(filePath1), FILE_TYPE.Error)
  })

  it('copyFile()/move()/delete() Directory', async () => {
    await copyFile(SOURCE_DIRECTORY, directoryPath0)
    equal(await getPathType(directoryPath0), FILE_TYPE.Directory)
    await moveFile(directoryPath0, directoryPath1)
    equal(await getPathType(directoryPath0), FILE_TYPE.Error)
    equal(await getPathType(directoryPath1), FILE_TYPE.Directory)
    await deleteFile(directoryPath1)
    equal(await getPathType(directoryPath1), FILE_TYPE.Error)
  })

  it('copyDirectory()/move()/delete() File', async () => {
    let getExpectedError = false
    try { await copyDirectory(filePath2, filePath0) } catch (error) { getExpectedError = true }
    equal(getExpectedError, true)

    getExpectedError = false
    try { await moveDirectory(filePath2, filePath0) } catch (error) { getExpectedError = true }
    equal(getExpectedError, true)

    getExpectedError = false
    try { await deleteDirectory(filePath2) } catch (error) { getExpectedError = true }
    equal(getExpectedError, true)
  })

  it('copyDirectory()/move()/delete() Directory', async () => {
    await copyDirectory(SOURCE_DIRECTORY, directoryPath0)
    equal(await getPathType(directoryPath0), FILE_TYPE.Directory)
    await moveDirectory(directoryPath0, directoryPath1)
    equal(await getPathType(directoryPath0), FILE_TYPE.Error)
    equal(await getPathType(directoryPath1), FILE_TYPE.Directory)
    await deleteDirectory(directoryPath1)
    equal(await getPathType(directoryPath1), FILE_TYPE.Error)
  })
})
