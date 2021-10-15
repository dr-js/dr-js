import { resolve } from 'path'
import { strictEqual } from 'source/common/verify.js'
import { STAT_ERROR, PATH_TYPE, getPathTypeFromStat, getPathLstat, getPathLstatSync, addTrailingSep } from './Path.js'
import { deleteDirectory, resetDirectory } from './Directory.js'

import {
  modifyCopy, modifyCopySync,
  modifyRename, modifyRenameSync,
  modifyDelete, modifyDeleteSync // modifyDeleteForce, modifyDeleteForceSync
} from './Modify.js'

const { describe, it, before, after } = globalThis

const TEST_ROOT = addTrailingSep(resolve(__dirname, './test-modify-gitignore/'))
const SOURCE_FILE = resolve(__dirname, './Modify.js')
const SOURCE_DIRECTORY = addTrailingSep(resolve(__dirname, '../'))

const filePath0 = resolve(TEST_ROOT, 'file0.js')
const filePath1 = resolve(TEST_ROOT, 'file1.js')
const filePath2 = resolve(TEST_ROOT, 'file2.js')

const directoryPath0 = addTrailingSep(resolve(TEST_ROOT, 'directory0/'))
const directoryPath1 = addTrailingSep(resolve(TEST_ROOT, 'directory1/'))

before(async () => {
  await resetDirectory(TEST_ROOT)
  await modifyCopy(SOURCE_FILE, filePath2)
})

after(async () => {
  await deleteDirectory(TEST_ROOT)
})

describe('Node.Fs.Modify', () => {
  it('copy/rename/delete File', async () => {
    await modifyCopy(SOURCE_FILE, filePath0)
    strictEqual(getPathTypeFromStat(await getPathLstat(filePath0)), PATH_TYPE.File)

    await modifyRename(filePath0, filePath1)
    strictEqual(await getPathLstat(filePath0), STAT_ERROR)
    strictEqual(getPathTypeFromStat(await getPathLstat(filePath1)), PATH_TYPE.File)

    await modifyDelete(filePath1)
    strictEqual(await getPathLstat(filePath1), STAT_ERROR)
  })
  it('copy/rename/delete File sync', () => {
    modifyCopySync(SOURCE_FILE, filePath0)
    strictEqual(getPathTypeFromStat(getPathLstatSync(filePath0)), PATH_TYPE.File)

    modifyRenameSync(filePath0, filePath1)
    strictEqual(getPathLstatSync(filePath0), STAT_ERROR)
    strictEqual(getPathTypeFromStat(getPathLstatSync(filePath1)), PATH_TYPE.File)

    modifyDeleteSync(filePath1)
    strictEqual(getPathLstatSync(filePath1), STAT_ERROR)
  })

  it('copy/rename/delete Directory', async () => {
    await modifyCopy(SOURCE_DIRECTORY, directoryPath0)
    strictEqual(getPathTypeFromStat(await getPathLstat(directoryPath0)), PATH_TYPE.Directory)

    await modifyRename(directoryPath0, directoryPath1)
    strictEqual(await getPathLstat(directoryPath0), STAT_ERROR)
    strictEqual(getPathTypeFromStat(await getPathLstat(directoryPath1)), PATH_TYPE.Directory)

    await modifyDelete(directoryPath1)
    strictEqual(await getPathLstat(directoryPath1), STAT_ERROR)
  })
  it('copy/rename/delete Directory sync', () => {
    modifyCopySync(SOURCE_DIRECTORY, directoryPath0)
    strictEqual(getPathTypeFromStat(getPathLstatSync(directoryPath0)), PATH_TYPE.Directory)

    modifyRenameSync(directoryPath0, directoryPath1)
    strictEqual(getPathLstatSync(directoryPath0), STAT_ERROR)
    strictEqual(getPathTypeFromStat(getPathLstatSync(directoryPath1)), PATH_TYPE.Directory)

    modifyDeleteSync(directoryPath1)
    strictEqual(getPathLstatSync(directoryPath1), STAT_ERROR)
  })
})
