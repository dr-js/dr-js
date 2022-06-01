import { resolve, sep } from 'node:path'
import { homedir } from 'node:os'
import { strictEqual, doThrow, truthy } from 'source/common/verify.js'
import { deleteDirectory, copyDirectory, copyDirectorySync, resetDirectory, resetDirectorySync } from './Directory.js'

import {
  STAT_ERROR,
  PATH_TYPE,

  getPathTypeFromStat,
  getPathLstat, getPathLstatSync, getPathStat, getPathStatSync,

  copyPath, copyPathSync,
  renamePath, renamePathSync,
  deletePath, deletePathSync, deletePathForce, deletePathForceSync,

  existPath, existPathSync,
  nearestExistPath, nearestExistPathSync,
  toPosixPath,
  addTrailingSep, dropTrailingSep,
  expandHome, resolveHome,
  createPathPrefixLock
} from './Path.js'

const { describe, it, before, after } = globalThis

const TEST_ROOT = addTrailingSep(resolve(__dirname, './test-file-gitignore/'))
const SOURCE_FILE = resolve(__dirname, './Path.js')
const SOURCE_DIRECTORY = addTrailingSep(resolve(__dirname, '../module/'))
const SOURCE_DIRECTORY_TRIM = resolve(__dirname, '../module/')

const invalidPath = '../../../../../../../../../../../../../../../../../../../../../../../../a/b/c/d/e/f/g'

const filePath0 = resolve(TEST_ROOT, 'file0.js')
const filePath1 = resolve(TEST_ROOT, 'file1.js')
const filePathDelete = resolve(TEST_ROOT, 'file.delete.js')
const filePathRenameFrom = resolve(TEST_ROOT, 'file.rename-from.js')
const filePathRenameTo = resolve(TEST_ROOT, 'file.rename-to.js')

const directoryPath0 = addTrailingSep(resolve(TEST_ROOT, 'a/b/c/'))
// const directoryPath1 = addTrailingSep(resolve(TEST_ROOT, 'a/b/c/d/'))
const directoryPath2 = addTrailingSep(resolve(TEST_ROOT, 'a/b/c/d/e/'))
const directoryPathDelete0 = addTrailingSep(resolve(TEST_ROOT, 'delete/a/b/c/'))
const directoryPathDelete1 = addTrailingSep(resolve(TEST_ROOT, 'delete/a/b/c/d/'))
const directoryPathDelete2 = addTrailingSep(resolve(TEST_ROOT, 'delete/a/b/c/d/e/'))

const directoryPath3 = addTrailingSep(resolve(TEST_ROOT, 'a/e0/'))
const directoryPathRenameFrom = addTrailingSep(resolve(TEST_ROOT, 'a/e.rename-from/'))
const directoryPathRenameTo = addTrailingSep(resolve(TEST_ROOT, 'a/e1.rename-to/'))

before(async () => {
  await resetDirectory(TEST_ROOT)
})

after(async () => {
  await deleteDirectory(TEST_ROOT)
})

describe('Node.Fs.Path', () => {
  it('getPathLstat()', async () => {
    strictEqual(getPathTypeFromStat(await getPathLstat(SOURCE_FILE)), PATH_TYPE.File)
    strictEqual(getPathTypeFromStat(await getPathLstat(SOURCE_DIRECTORY)), PATH_TYPE.Directory)
    strictEqual(getPathTypeFromStat(await getPathLstat(SOURCE_DIRECTORY_TRIM)), PATH_TYPE.Directory)
    strictEqual(await getPathLstat(invalidPath), STAT_ERROR)
    strictEqual(getPathTypeFromStat(await getPathLstat(invalidPath)), PATH_TYPE.Error)
  })
  it('getPathLstatSync()', () => {
    strictEqual(getPathTypeFromStat(getPathLstatSync(SOURCE_FILE)), PATH_TYPE.File)
    strictEqual(getPathTypeFromStat(getPathLstatSync(SOURCE_DIRECTORY)), PATH_TYPE.Directory)
    strictEqual(getPathTypeFromStat(getPathLstatSync(SOURCE_DIRECTORY_TRIM)), PATH_TYPE.Directory)
    strictEqual(getPathLstatSync(invalidPath), STAT_ERROR)
    strictEqual(getPathTypeFromStat(getPathLstatSync(invalidPath)), PATH_TYPE.Error)
  })

  it('getPathStat()', async () => {
    strictEqual(getPathTypeFromStat(await getPathStat(SOURCE_FILE)), PATH_TYPE.File)
    strictEqual(getPathTypeFromStat(await getPathStat(SOURCE_DIRECTORY)), PATH_TYPE.Directory)
    strictEqual(getPathTypeFromStat(await getPathStat(SOURCE_DIRECTORY_TRIM)), PATH_TYPE.Directory)
    strictEqual(await getPathStat(invalidPath), STAT_ERROR)
    strictEqual(getPathTypeFromStat(await getPathStat(invalidPath)), PATH_TYPE.Error)
  })
  it('getPathStatSync()', () => {
    strictEqual(getPathTypeFromStat(getPathStatSync(SOURCE_FILE)), PATH_TYPE.File)
    strictEqual(getPathTypeFromStat(getPathStatSync(SOURCE_DIRECTORY)), PATH_TYPE.Directory)
    strictEqual(getPathTypeFromStat(getPathStatSync(SOURCE_DIRECTORY_TRIM)), PATH_TYPE.Directory)
    strictEqual(getPathStatSync(invalidPath), STAT_ERROR)
    strictEqual(getPathTypeFromStat(getPathStatSync(invalidPath)), PATH_TYPE.Error)
  })

  it('copyPath()', async () => {
    await resetDirectory(directoryPath2)

    await copyPath(SOURCE_FILE, filePath0)
    strictEqual(getPathTypeFromStat(await getPathLstat(filePath0)), PATH_TYPE.File)

    let getExpectedError = false
    try { await copyPath(TEST_ROOT, invalidPath) } catch (error) { getExpectedError = true }
    truthy(getExpectedError)

    await copyPath(SOURCE_FILE, filePath1)
    await copyPath(SOURCE_FILE, filePath1)

    await copyPath(directoryPath2, directoryPath3)
    await copyPath(directoryPath2, directoryPath3)

    strictEqual(getPathTypeFromStat(await getPathLstat(filePath1)), PATH_TYPE.File)
    strictEqual(getPathTypeFromStat(await getPathLstat(directoryPath3)), PATH_TYPE.Directory)
  })
  it('copyPathSync()', () => {
    resetDirectorySync(directoryPath2)

    copyPathSync(SOURCE_FILE, filePath0)
    strictEqual(getPathTypeFromStat(getPathLstatSync(filePath0)), PATH_TYPE.File)

    let getExpectedError = false
    try { copyPathSync(TEST_ROOT, invalidPath) } catch (error) { getExpectedError = true }
    truthy(getExpectedError)

    copyPathSync(SOURCE_FILE, filePath1)
    copyPathSync(SOURCE_FILE, filePath1)

    copyPathSync(directoryPath2, directoryPath3)
    copyPathSync(directoryPath2, directoryPath3)

    strictEqual(getPathTypeFromStat(getPathLstatSync(filePath1)), PATH_TYPE.File)
    strictEqual(getPathTypeFromStat(getPathLstatSync(directoryPath3)), PATH_TYPE.Directory)
  })

  it('renamePath()', async () => {
    let getExpectedError = false
    try { await renamePath(invalidPath, TEST_ROOT) } catch (error) { getExpectedError = true }
    truthy(getExpectedError)

    await copyPath(filePath1, filePathRenameFrom)
    await renamePath(filePathRenameFrom, filePathRenameTo)
    await copyPath(directoryPath3, directoryPathRenameFrom)
    await renamePath(directoryPathRenameFrom, directoryPathRenameTo)

    strictEqual(await getPathLstat(filePathRenameFrom), STAT_ERROR)
    strictEqual(await getPathLstat(directoryPathRenameFrom), STAT_ERROR)
    strictEqual(getPathTypeFromStat(await getPathLstat(filePathRenameTo)), PATH_TYPE.File)
    strictEqual(getPathTypeFromStat(await getPathLstat(directoryPathRenameTo)), PATH_TYPE.Directory)

    getExpectedError = false
    await copyPath(directoryPath3, directoryPathRenameFrom)
    try { await renamePath(directoryPathRenameFrom, directoryPathRenameTo) } catch (error) { getExpectedError = true }
    strictEqual(getExpectedError, process.platform === 'win32')// TODO: NOTE: should only error on win32, currently linux & darwin will replace the empty dir

    process.platform === 'win32'
      ? strictEqual(getPathTypeFromStat(await getPathLstat(directoryPathRenameFrom)), PATH_TYPE.Directory)
      : strictEqual(await getPathLstat(directoryPathRenameFrom), STAT_ERROR)

    await deletePath(filePathRenameTo) // clear for next test
    await deletePath(directoryPathRenameTo) // clear for next test
    process.platform === 'win32' && await deletePath(directoryPathRenameFrom) // clear for next test
  })
  it('renamePathSync()', () => {
    let getExpectedError = false
    try { renamePathSync(invalidPath, TEST_ROOT) } catch (error) { getExpectedError = true }
    truthy(getExpectedError)

    copyPathSync(filePath1, filePathRenameFrom)
    renamePathSync(filePathRenameFrom, filePathRenameTo)
    copyPathSync(directoryPath3, directoryPathRenameFrom)
    renamePathSync(directoryPathRenameFrom, directoryPathRenameTo)
    strictEqual(getPathLstatSync(filePathRenameFrom), STAT_ERROR)
    strictEqual(getPathLstatSync(directoryPathRenameFrom), STAT_ERROR)
    strictEqual(getPathTypeFromStat(getPathLstatSync(filePathRenameTo)), PATH_TYPE.File)
    strictEqual(getPathTypeFromStat(getPathLstatSync(directoryPathRenameTo)), PATH_TYPE.Directory)

    getExpectedError = false
    copyPathSync(directoryPath3, directoryPathRenameFrom)
    try { renamePathSync(directoryPathRenameFrom, directoryPathRenameTo) } catch (error) { getExpectedError = true }
    strictEqual(getExpectedError, process.platform === 'win32') // TODO: NOTE: should only error on win32, currently linux & darwin will replace the empty dir

    process.platform === 'win32'
      ? strictEqual(getPathTypeFromStat(getPathLstatSync(directoryPathRenameFrom)), PATH_TYPE.Directory)
      : strictEqual(getPathLstatSync(directoryPathRenameFrom), STAT_ERROR)

    deletePathSync(filePathRenameTo) // clear for next test
    deletePathSync(directoryPathRenameTo) // clear for next test
    process.platform === 'win32' && deletePathSync(directoryPathRenameFrom) // clear for next test
  })

  it('deletePath()', async () => {
    let getExpectedError = false
    try { await deletePath(TEST_ROOT) } catch (error) { getExpectedError = true }
    truthy(getExpectedError)

    await copyDirectory(directoryPath0, directoryPathDelete0)
    await copyPath(filePath0, filePathDelete)

    await deletePath(directoryPathDelete2)
    await deletePath(directoryPathDelete1)
    await deletePathForceSync(directoryPathDelete0)
    await deletePath(filePathDelete)
    await deletePathForce(filePathDelete)

    strictEqual(await getPathLstat(directoryPathDelete0), STAT_ERROR)
    strictEqual(await getPathLstat(filePathDelete), STAT_ERROR)
  })
  it('deletePathSync()', () => {
    let getExpectedError = false
    try { deletePathSync(TEST_ROOT) } catch (error) { getExpectedError = true }
    truthy(getExpectedError)

    copyDirectorySync(directoryPath0, directoryPathDelete0)
    copyPathSync(filePath0, filePathDelete)

    deletePathSync(directoryPathDelete2)
    deletePathSync(directoryPathDelete1)
    deletePathForceSync(directoryPathDelete0)
    deletePathSync(filePathDelete)
    deletePathForceSync(filePathDelete)

    strictEqual(getPathLstatSync(directoryPathDelete0), STAT_ERROR)
    strictEqual(getPathLstatSync(filePathDelete), STAT_ERROR)
  })

  it('existPath()', async () => {
    truthy(await existPath(TEST_ROOT))
    truthy(await existPath(__dirname))
    truthy(await existPath(__filename))

    truthy(!await existPath(invalidPath))
    truthy(!await existPath(resolve(__filename, 'not-exist')))
    truthy(!await existPath(resolve(TEST_ROOT, '11/22/33/44/55')))
  })
  it('existPathSync()', () => {
    truthy(existPathSync(TEST_ROOT))
    truthy(existPathSync(__dirname))
    truthy(existPathSync(__filename))

    truthy(!existPathSync(invalidPath))
    truthy(!existPathSync(resolve(__filename, 'not-exist')))
    truthy(!existPathSync(resolve(TEST_ROOT, '11/22/33/44/55')))
  })

  it('nearestExistPath()', async () => {
    strictEqual(await nearestExistPath(TEST_ROOT), TEST_ROOT)
    strictEqual(await nearestExistPath(__dirname), __dirname)
    strictEqual(await nearestExistPath(__filename), __filename)

    strictEqual(await nearestExistPath(resolve(__filename, 'not-exist')), __filename)
    strictEqual(addTrailingSep(await nearestExistPath(resolve(TEST_ROOT, '11/22/33/44/55'))), TEST_ROOT)
  })
  it('nearestExistPathSync()', () => {
    strictEqual(nearestExistPathSync(TEST_ROOT), TEST_ROOT)
    strictEqual(nearestExistPathSync(__dirname), __dirname)
    strictEqual(nearestExistPathSync(__filename), __filename)

    strictEqual(nearestExistPathSync(resolve(__filename, 'not-exist')), __filename)
    strictEqual(addTrailingSep(nearestExistPathSync(resolve(TEST_ROOT, '11/22/33/44/55'))), TEST_ROOT)
  })

  it('toPosixPath()', () => {
    strictEqual(toPosixPath('a/b/c'), 'a/b/c')
    strictEqual(toPosixPath('a/b/c/'), 'a/b/c/')
    strictEqual(toPosixPath('a\\b\\c'), 'a/b/c')
    strictEqual(toPosixPath('a\\b\\c\\'), 'a/b/c/')
  })

  it('dropTrailingSep()', () => {
    strictEqual(dropTrailingSep(TEST_ROOT + sep) + sep, TEST_ROOT)
    strictEqual(dropTrailingSep(TEST_ROOT + sep + sep) + sep, TEST_ROOT)
  })

  it('expandHome()', () => {
    strictEqual(expandHome('aaa'), 'aaa')
    strictEqual(expandHome(''), '')
    strictEqual(expandHome('~a'), '~a')
    strictEqual(expandHome('~.'), '~.')
    strictEqual(expandHome('~'), homedir())
    strictEqual(expandHome('~/'), homedir() + '/')
    strictEqual(expandHome('~\\'), homedir() + '\\')
    strictEqual(expandHome('~/aaaa/bbb'), homedir() + '/aaaa/bbb')
    strictEqual(expandHome('~\\aaaa/bbb'), homedir() + '\\aaaa/bbb')
  })

  it('resolveHome()', () => {
    strictEqual(resolveHome('~', 'a', 'b'), resolve(homedir(), 'a/b'))
    strictEqual(resolveHome('/a', '~/a', '~/b'), resolve(homedir(), 'b'))
    strictEqual(resolveHome('~/a', '/b'), resolve(homedir(), '/b')) // NOTE: on win32 will get output like: "C:\\b"
  })

  it('createPathPrefixLock()', () => {
    const checkPath = (getPathFromRoot, rootPath) => {
      const expectedPath = resolve(`${rootPath}/a/b/c`)
      strictEqual(getPathFromRoot('a/b/c'), expectedPath)
      strictEqual(getPathFromRoot('./a/b/c'), expectedPath)
      strictEqual(getPathFromRoot('a/d/../b/c'), expectedPath)
      doThrow(() => getPathFromRoot('..'), 'should throw Error for too much "../"')
      doThrow(() => getPathFromRoot('a/../../b'), 'should throw Error for too much "../"')
    }

    const getPathFromRoot0 = createPathPrefixLock('/root/path/0/')
    const getPathFromRoot1 = createPathPrefixLock('/root/../root/path/./1')
    const getPathFromRoot2 = createPathPrefixLock('/root/path////2')

    checkPath(getPathFromRoot0, '/root/path/0')
    checkPath(getPathFromRoot1, '/root/path/1')
    checkPath(getPathFromRoot2, '/root/path/2')
  })
})
