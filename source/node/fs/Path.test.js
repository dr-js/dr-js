import { resolve, sep } from 'path'
import { homedir } from 'os'
import { strictEqual, doThrow } from 'source/common/verify.js'
import { resetDirectory } from './Directory.js'

import {
  STAT_ERROR,
  PATH_TYPE,

  getPathTypeFromStat,
  getPathLstat, getPathStat,

  copyPath,
  renamePath,
  deletePath,

  existPath, nearestExistPath,
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
const filePath2 = resolve(TEST_ROOT, 'file2.js')

const directoryPath0 = addTrailingSep(resolve(TEST_ROOT, 'a/b/c/'))
const directoryPath1 = addTrailingSep(resolve(TEST_ROOT, 'a/b/c/d/'))
const directoryPath2 = addTrailingSep(resolve(TEST_ROOT, 'a/b/c/d/e/'))

const directoryPath3 = addTrailingSep(resolve(TEST_ROOT, 'a/e0/'))
const directoryPath4 = addTrailingSep(resolve(TEST_ROOT, 'a/e1/'))

const directoryPath5 = addTrailingSep(resolve(TEST_ROOT, 'a/b/'))
const directoryPath6 = addTrailingSep(resolve(TEST_ROOT, 'a/'))

before(async () => {
  await resetDirectory(TEST_ROOT)
})

after(async () => {
  await deletePath(filePath2)
  await deletePath(directoryPath4)
  await deletePath(directoryPath5)
  await deletePath(directoryPath6)
  await deletePath(TEST_ROOT)
})

describe('Node.Fs.Path', () => {
  it('getPathLstat()', async () => {
    strictEqual(getPathTypeFromStat(await getPathLstat(SOURCE_FILE)), PATH_TYPE.File)
    strictEqual(getPathTypeFromStat(await getPathLstat(SOURCE_DIRECTORY)), PATH_TYPE.Directory)
    strictEqual(getPathTypeFromStat(await getPathLstat(SOURCE_DIRECTORY_TRIM)), PATH_TYPE.Directory)
    strictEqual(await getPathLstat(invalidPath), STAT_ERROR)
    strictEqual(getPathTypeFromStat(await getPathLstat(invalidPath)), PATH_TYPE.Error)
  })

  it('getPathStat()', async () => {
    strictEqual(getPathTypeFromStat(await getPathStat(SOURCE_FILE)), PATH_TYPE.File)
    strictEqual(getPathTypeFromStat(await getPathStat(SOURCE_DIRECTORY)), PATH_TYPE.Directory)
    strictEqual(getPathTypeFromStat(await getPathStat(SOURCE_DIRECTORY_TRIM)), PATH_TYPE.Directory)
    strictEqual(await getPathStat(invalidPath), STAT_ERROR)
    strictEqual(getPathTypeFromStat(await getPathStat(invalidPath)), PATH_TYPE.Error)
  })

  it('copyPath()', async () => {
    await resetDirectory(directoryPath2)

    await copyPath(SOURCE_FILE, filePath0)
    strictEqual(getPathTypeFromStat(await getPathLstat(filePath0)), PATH_TYPE.File)

    let getExpectedError = false
    try { await copyPath(TEST_ROOT, invalidPath) } catch (error) { getExpectedError = true }
    strictEqual(getExpectedError, true)

    await copyPath(SOURCE_FILE, filePath1)
    await copyPath(SOURCE_FILE, filePath1)

    await copyPath(directoryPath2, directoryPath3)
    await copyPath(directoryPath2, directoryPath3)

    strictEqual(getPathTypeFromStat(await getPathLstat(filePath1)), PATH_TYPE.File)
    strictEqual(getPathTypeFromStat(await getPathLstat(directoryPath3)), PATH_TYPE.Directory)
  })

  it('renamePath()', async () => {
    let getExpectedError = false
    try { await renamePath(invalidPath, TEST_ROOT) } catch (error) { getExpectedError = true }
    strictEqual(getExpectedError, true)

    await renamePath(filePath1, filePath2)
    await renamePath(directoryPath3, directoryPath4)

    strictEqual(await getPathLstat(filePath1), STAT_ERROR)
    strictEqual(await getPathLstat(directoryPath3), STAT_ERROR)
    strictEqual(getPathTypeFromStat(await getPathLstat(filePath2)), PATH_TYPE.File)
    strictEqual(getPathTypeFromStat(await getPathLstat(directoryPath4)), PATH_TYPE.Directory)
  })

  it('deletePath()', async () => {
    let getExpectedError = false
    try { await deletePath(TEST_ROOT) } catch (error) { getExpectedError = true }
    strictEqual(getExpectedError, true)

    await deletePath(directoryPath2)
    await deletePath(directoryPath1)
    await deletePath(directoryPath0)
    await deletePath(filePath0)

    strictEqual(await getPathLstat(filePath0), STAT_ERROR)
  })

  it('existPath()', async () => {
    strictEqual(await existPath(TEST_ROOT), true)
    strictEqual(await existPath(__dirname), true)
    strictEqual(await existPath(__filename), true)

    strictEqual(await existPath(invalidPath), false)
    strictEqual(await existPath(resolve(__filename, 'not-exist')), false)
    strictEqual(await existPath(resolve(TEST_ROOT, '11/22/33/44/55')), false)
  })

  it('nearestExistPath()', async () => {
    strictEqual(await nearestExistPath(TEST_ROOT), TEST_ROOT)
    strictEqual(await nearestExistPath(__dirname), __dirname)
    strictEqual(await nearestExistPath(__filename), __filename)

    strictEqual(await nearestExistPath(resolve(__filename, 'not-exist')), __filename)
    strictEqual(addTrailingSep(await nearestExistPath(resolve(TEST_ROOT, '11/22/33/44/55'))), TEST_ROOT)
  })

  it('toPosixPath()', async () => {
    strictEqual(toPosixPath('a/b/c'), 'a/b/c')
    strictEqual(toPosixPath('a/b/c/'), 'a/b/c/')
    strictEqual(toPosixPath('a\\b\\c'), 'a/b/c')
    strictEqual(toPosixPath('a\\b\\c\\'), 'a/b/c/')
  })

  it('dropTrailingSep()', async () => {
    strictEqual(dropTrailingSep(TEST_ROOT + sep) + sep, TEST_ROOT)
    strictEqual(dropTrailingSep(TEST_ROOT + sep + sep) + sep, TEST_ROOT)
  })

  it('expandHome()', async () => {
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

  it('resolveHome()', async () => {
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
