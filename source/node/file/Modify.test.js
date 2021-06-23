import { strictEqual } from 'source/common/verify'
import { resolve, sep } from 'path'
import { STAT_ERROR, PATH_TYPE, getPathTypeFromStat, getPathLstat } from './Path'
import { resetDirectory } from './Directory'

import {
  modifyCopy,
  modifyRename,
  modifyDelete
} from './Modify'

const { describe, it, before, after } = global

const TEST_ROOT = resolve(__dirname, './test-modify-gitignore/') + sep
const SOURCE_FILE = resolve(__dirname, './Modify.js')
const SOURCE_DIRECTORY = resolve(__dirname, '../') + sep

const filePath0 = resolve(TEST_ROOT, 'file0.js')
const filePath1 = resolve(TEST_ROOT, 'file1.js')
const filePath2 = resolve(TEST_ROOT, 'file2.js')

const directoryPath0 = resolve(TEST_ROOT, 'directory0/') + sep
const directoryPath1 = resolve(TEST_ROOT, 'directory1/') + sep

before(async () => {
  await resetDirectory(TEST_ROOT)
  await modifyCopy(SOURCE_FILE, filePath2)
})

after(async () => {
  await modifyDelete(TEST_ROOT)
})

describe('Node.File.Modify', () => {
  it('copy/rename/delete File', async () => {
    await modifyCopy(SOURCE_FILE, filePath0)
    strictEqual(getPathTypeFromStat(await getPathLstat(filePath0)), PATH_TYPE.File)

    await modifyRename(filePath0, filePath1)
    strictEqual(await getPathLstat(filePath0), STAT_ERROR)
    strictEqual(getPathTypeFromStat(await getPathLstat(filePath1)), PATH_TYPE.File)

    await modifyDelete(filePath1)
    strictEqual(await getPathLstat(filePath1), STAT_ERROR)
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
})
