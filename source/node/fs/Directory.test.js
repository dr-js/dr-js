import { join as joinPath, dirname, resolve } from 'node:path'
import { strictEqual, stringifyEqual, doThrow, doThrowAsync, includes, truthy } from 'source/common/verify.js'
import { getSample } from 'source/common/math/sample.js'
import { PATH_TYPE, getPathTypeFromStat, getPathLstat, getPathLstatSync, addTrailingSep } from './Path.js'
import { writeTextSync } from './File.js'
import {
  // getPathTypeFromDirent,
  getDirInfoList, getDirInfoListSync,
  getDirInfoTree, getDirInfoTreeSync,

  walkDirInfoTree, walkDirInfoTreeSync,
  walkDirInfoTreeBottomUp, walkDirInfoTreeBottomUpSync,

  copyDirInfoTree, copyDirInfoTreeSync,
  renameDirInfoTree, renameDirInfoTreeSync,
  deleteDirInfoTree, deleteDirInfoTreeSync,

  createDirectory, createDirectorySync,
  // copyDirectory, copyDirectorySync,
  deleteDirectory, deleteDirectorySync,
  resetDirectory, resetDirectorySync,

  // withTempDirectory, withTempDirectorySync,
  getFileList, getFileListSync
} from './Directory.js'

const { describe, it, before, after } = globalThis

const TEST_ROOT = addTrailingSep(resolve(__dirname, './test-directory-gitignore/'))
const SOURCE_FILE = addTrailingSep(resolve(__dirname, './Directory.js'))
const SOURCE_DIRECTORY = addTrailingSep(resolve(__dirname, '../data/'))
const SOURCE_DIRECTORY_UPPER = addTrailingSep(resolve(__dirname, '../'))

const invalidPath = '../../../../../../../../../../../../../../../../../../../../../../../../a/b/c/d/e/f/g'

const directoryPath0 = addTrailingSep(resolve(TEST_ROOT, 'a/b/c/d/e/'))
const directoryPath1 = addTrailingSep(resolve(TEST_ROOT, '1/2/3/4/5/'))
const directoryPath2 = addTrailingSep(resolve(TEST_ROOT, '1/'))

const directoryPathCopy = addTrailingSep(resolve(TEST_ROOT, 'copy-source/b/c/d/e/'))
const directoryPathCopySource = addTrailingSep(resolve(TEST_ROOT, 'copy-source/'))
const directoryPathCopyTarget = addTrailingSep(resolve(TEST_ROOT, 'copy-target/'))

const directoryPathRename = addTrailingSep(resolve(TEST_ROOT, 'rename-source/b/c/d/e/'))
const directoryPathRenameSource = addTrailingSep(resolve(TEST_ROOT, 'rename-source/'))
const directoryPathRenameTarget = addTrailingSep(resolve(TEST_ROOT, 'rename-target/'))

const directoryPathDelete = addTrailingSep(resolve(TEST_ROOT, 'delete-source/b/c/d/e/'))
const directoryPathDeleteSource = addTrailingSep(resolve(TEST_ROOT, 'delete-source/'))

before(async () => {
  await createDirectory(TEST_ROOT)
  createDirectorySync(directoryPath0)
  await createDirectory(directoryPath1)
  createDirectorySync(directoryPathRename)
  await createDirectory(directoryPathCopy)
  createDirectorySync(directoryPathDelete)
})

after(async () => {
  await deleteDirectory(TEST_ROOT)
})

describe('Node.Fs.Directory', () => {
  it('getDirInfoList()', async () => {
    await doThrowAsync(() => getDirInfoList(invalidPath))
    await doThrowAsync(() => getDirInfoList(SOURCE_FILE))

    await getDirInfoList(SOURCE_DIRECTORY)
    await getDirInfoList(SOURCE_DIRECTORY_UPPER)
    await getDirInfoList(TEST_ROOT)
  })
  it('getDirInfoListSync()', () => {
    doThrow(() => getDirInfoListSync(invalidPath))
    doThrow(() => getDirInfoListSync(SOURCE_FILE))

    getDirInfoListSync(SOURCE_DIRECTORY)
    getDirInfoListSync(SOURCE_DIRECTORY_UPPER)
    getDirInfoListSync(TEST_ROOT)
  })

  it('getDirInfoTree()', async () => {
    await doThrowAsync(() => getDirInfoTree(invalidPath))
    await doThrowAsync(() => getDirInfoTree(SOURCE_FILE))

    await getDirInfoTree(SOURCE_DIRECTORY)
    await getDirInfoTree(SOURCE_DIRECTORY_UPPER)

    const dirInfoTree = await getDirInfoTree(TEST_ROOT)
    // console.log(dirInfoTree)
    strictEqual(addTrailingSep(dirInfoTree.root), TEST_ROOT)
    strictEqual(dirInfoTree.dirInfoListMap.get(dirInfoTree.root).length, 5)
    strictEqual(dirInfoTree.dirInfoListMap.size, 26)
    stringifyEqual(
      dirInfoTree.dirInfoListMap.get(dirInfoTree.root).map(({ type }) => type),
      getSample(() => PATH_TYPE.Directory, dirInfoTree.dirInfoListMap.get(dirInfoTree.root).length)
    )
  })
  it('getDirInfoTreeSync()', () => {
    doThrow(() => getDirInfoTreeSync(invalidPath))
    doThrow(() => getDirInfoTreeSync(SOURCE_FILE))

    getDirInfoTreeSync(SOURCE_DIRECTORY)
    getDirInfoTreeSync(SOURCE_DIRECTORY_UPPER)

    const dirInfoTree = getDirInfoTreeSync(TEST_ROOT)
    // console.log(dirInfoTree)
    strictEqual(addTrailingSep(dirInfoTree.root), TEST_ROOT)
    strictEqual(dirInfoTree.dirInfoListMap.get(dirInfoTree.root).length, 5)
    strictEqual(dirInfoTree.dirInfoListMap.size, 26)
    stringifyEqual(
      dirInfoTree.dirInfoListMap.get(dirInfoTree.root).map(({ type }) => type),
      getSample(() => PATH_TYPE.Directory, dirInfoTree.dirInfoListMap.get(dirInfoTree.root).length)
    )
  })

  it('walkDirInfoTree()', async () => {
    let callbackCount = 0
    await walkDirInfoTree(await getDirInfoTree(TEST_ROOT), (dirInfo) => {
      // console.log(' - - dirInfo', dirInfo)
      callbackCount++
    })
    strictEqual(callbackCount, 25)

    const checkNameList = '2345'.split('')
    await walkDirInfoTree(await getDirInfoTree(directoryPath2), (dirInfo) => {
      // console.log(' - - dirInfo', dirInfo)
      strictEqual(dirInfo.name, checkNameList.shift())
    })
  })
  it('walkDirInfoTree()', () => {
    let callbackCount = 0
    walkDirInfoTreeSync(getDirInfoTreeSync(TEST_ROOT), (dirInfo) => {
      // console.log(' - - dirInfo', dirInfo)
      callbackCount++
    })
    strictEqual(callbackCount, 25)

    const checkNameList = '2345'.split('')
    walkDirInfoTreeSync(getDirInfoTreeSync(directoryPath2), (dirInfo) => {
      // console.log(' - - dirInfo', dirInfo)
      strictEqual(dirInfo.name, checkNameList.shift())
    })
  })

  it('walkDirInfoTreeBottomUp()', async () => {
    let callbackCount = 0
    await walkDirInfoTreeBottomUp(await getDirInfoTree(TEST_ROOT), (dirInfo) => {
      // console.log(' - - dirInfo', dirInfo)
      callbackCount++
    })
    strictEqual(callbackCount, 25)

    const checkNameList = '2345'.split('')
    await walkDirInfoTreeBottomUp(await getDirInfoTree(directoryPath2), (dirInfo) => {
      // console.log(' - - dirInfo', dirInfo)
      strictEqual(dirInfo.name, checkNameList.pop())
    })
  })
  it('walkDirInfoTreeBottomUpSync()', () => {
    let callbackCount = 0
    walkDirInfoTreeBottomUpSync(getDirInfoTreeSync(TEST_ROOT), (dirInfo) => {
      // console.log(' - - dirInfo', dirInfo)
      callbackCount++
    })
    strictEqual(callbackCount, 25)

    const checkNameList = '2345'.split('')
    walkDirInfoTreeBottomUpSync(getDirInfoTreeSync(directoryPath2), (dirInfo) => {
      // console.log(' - - dirInfo', dirInfo)
      strictEqual(dirInfo.name, checkNameList.pop())
    })
  })

  it('copyDirInfoTree()', async () => {
    await copyDirInfoTree(await getDirInfoTree(directoryPathCopySource), directoryPathCopyTarget)

    let callbackCount = 0
    await walkDirInfoTree(await getDirInfoTree(directoryPathCopyTarget), (dirInfo) => {
      // console.log(' - - dirInfo', dirInfo)
      callbackCount++
    })
    strictEqual(callbackCount, 4)
  })
  it('copyDirInfoTreeSync()', () => {
    copyDirInfoTreeSync(getDirInfoTreeSync(directoryPathCopySource), directoryPathCopyTarget)

    let callbackCount = 0
    walkDirInfoTreeSync(getDirInfoTreeSync(directoryPathCopyTarget), (dirInfo) => {
      // console.log(' - - dirInfo', dirInfo)
      callbackCount++
    })
    strictEqual(callbackCount, 4)
  })

  it('renameDirInfoTree()', async () => {
    await renameDirInfoTree(await getDirInfoTree(directoryPathRenameSource), directoryPathRenameTarget)

    let callbackCount = 0
    await walkDirInfoTree(await getDirInfoTree(directoryPathRenameTarget), (dirInfo) => {
      // console.log(' - - dirInfo', dirInfo)
      callbackCount++
    })
    strictEqual(callbackCount, 4)
  })
  it('renameDirInfoTreeSync()', () => {
    renameDirInfoTreeSync(getDirInfoTreeSync(directoryPathRenameSource), directoryPathRenameTarget)

    let callbackCount = 0
    walkDirInfoTreeSync(getDirInfoTreeSync(directoryPathRenameTarget), (dirInfo) => {
      // console.log(' - - dirInfo', dirInfo)
      callbackCount++
    })
    strictEqual(callbackCount, 4)
  })

  it('deleteDirInfoTree()', async () => {
    await deleteDirInfoTree(await getDirInfoTree(directoryPathDeleteSource), directoryPathDeleteSource)

    let callbackCount = 0
    await walkDirInfoTree(await getDirInfoTree(directoryPathDeleteSource), (dirInfo) => {
      // console.log(' - - dirInfo', dirInfo)
      callbackCount++
    })
    strictEqual(callbackCount, 0)
  })
  it('deleteDirInfoTreeSync()', () => {
    deleteDirInfoTreeSync(getDirInfoTreeSync(directoryPathDeleteSource), directoryPathDeleteSource)

    let callbackCount = 0
    walkDirInfoTreeSync(getDirInfoTreeSync(directoryPathDeleteSource), (dirInfo) => {
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
    truthy(getExpectedError)
  })
  it('createDirectorySync()', () => {
    createDirectorySync(directoryPath2)
    createDirectorySync(directoryPath0)
    createDirectorySync(directoryPath1)
    strictEqual(getPathTypeFromStat(getPathLstatSync(directoryPath0)), PATH_TYPE.Directory)
    strictEqual(getPathTypeFromStat(getPathLstatSync(directoryPath1)), PATH_TYPE.Directory)
    strictEqual(getPathTypeFromStat(getPathLstatSync(directoryPath2)), PATH_TYPE.Directory)

    let getExpectedError = false
    try { createDirectorySync(SOURCE_FILE) } catch (error) { getExpectedError = true }
    truthy(getExpectedError)
  })

  it('resetDirectory()', async () => {
    await createDirectory(resolve(TEST_ROOT, 'reset/'))

    writeTextSync(resolve(TEST_ROOT, 'reset/file-to-dir'), 'data')
    await resetDirectory(resolve(TEST_ROOT, 'reset/file-to-dir'))
    strictEqual((await getDirInfoList(resolve(TEST_ROOT, 'reset/file-to-dir'))).length, 0)

    await createDirectory(resolve(TEST_ROOT, 'reset/dir-empty/'))
    await resetDirectory(resolve(TEST_ROOT, 'reset/dir-empty/'))
    strictEqual((await getDirInfoList(resolve(TEST_ROOT, 'reset/dir-empty/'))).length, 0)

    await createDirectory(resolve(TEST_ROOT, 'reset/dir/q/w/e/r/t/y/'))
    writeTextSync(resolve(TEST_ROOT, 'reset/dir/q/w/e/file'), 'data')
    await resetDirectory(resolve(TEST_ROOT, 'reset/dir/'))
    strictEqual((await getDirInfoList(resolve(TEST_ROOT, 'reset/dir/'))).length, 0)

    await deleteDirectory(resolve(TEST_ROOT, 'reset/'))
  })
  it('resetDirectorySync()', () => {
    createDirectorySync(resolve(TEST_ROOT, 'reset/'))

    writeTextSync(resolve(TEST_ROOT, 'reset/file-to-dir'), 'data')
    resetDirectorySync(resolve(TEST_ROOT, 'reset/file-to-dir'))
    strictEqual((getDirInfoListSync(resolve(TEST_ROOT, 'reset/file-to-dir'))).length, 0)

    createDirectorySync(resolve(TEST_ROOT, 'reset/dir-empty/'))
    resetDirectorySync(resolve(TEST_ROOT, 'reset/dir-empty/'))
    strictEqual((getDirInfoListSync(resolve(TEST_ROOT, 'reset/dir-empty/'))).length, 0)

    createDirectorySync(resolve(TEST_ROOT, 'reset/dir/q/w/e/r/t/y/'))
    writeTextSync(resolve(TEST_ROOT, 'reset/dir/q/w/e/file'), 'data')
    resetDirectorySync(resolve(TEST_ROOT, 'reset/dir/'))
    strictEqual((getDirInfoListSync(resolve(TEST_ROOT, 'reset/dir/'))).length, 0)

    deleteDirectorySync(resolve(TEST_ROOT, 'reset/'))
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
      truthy(fileList.length >= 2)
      includes(fileList, LIST_FILE)
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
      truthy(jsFileList.length >= 2)
      includes(jsFileList, LIST_FILE)
      strictEqual(abcdefghFileList.length, 0)
    })

    it('getFileList(createPrefixMapperFileCollector) File', async () => {
      const fileList = await getFileList(LIST_FILE, createPrefixMapperFileCollector('PREFIX-'))
      strictEqual(fileList.length, 1)
      strictEqual(fileList[ 0 ][ 0 ], LIST_FILE)
      includes(fileList[ 0 ][ 1 ], 'PREFIX-')
    })

    it('getFileList(createPrefixMapperFileCollector) Directory', async () => {
      const fileList = await getFileList(LIST_DIRECTORY, createPrefixMapperFileCollector('PREFIX-'))
      truthy(fileList.length >= 2)
      includes(fileList.map((v) => v[ 0 ]), LIST_FILE)
      truthy(fileList.every((v) => v[ 1 ].includes('PREFIX-')))
    })
  })
  describe('getFileListSync()', () => {
    const LIST_FILE = resolve(__dirname, './Directory.js')
    const LIST_DIRECTORY = resolve(__dirname, '../')

    const createSuffixFilterFileCollector = (suffix) => (fileList, { path, name }) => { name.endsWith(suffix) && fileList.push(path) }
    const createPrefixMapperFileCollector = (prefix) => (fileList, { path, name }) => {
      fileList.push([ path, joinPath(dirname(path), prefix + name) ])
    }

    it('getFileListSync() File', () => {
      const fileList = getFileListSync(LIST_FILE)
      strictEqual(fileList.length, 1)
      strictEqual(fileList[ 0 ], LIST_FILE)
    })

    it('getFileListSync() Directory', () => {
      const fileList = getFileListSync(LIST_DIRECTORY)
      truthy(fileList.length >= 2)
      includes(fileList, LIST_FILE)
    })

    it('getFileListSync(createSuffixFilterFileCollector) File', () => {
      const jsFileList = getFileListSync(LIST_FILE, createSuffixFilterFileCollector('.js'))
      const abcdefghFileList = getFileListSync(LIST_FILE, createSuffixFilterFileCollector('.abcdefgh'))
      strictEqual(jsFileList.length, 1)
      strictEqual(jsFileList[ 0 ], LIST_FILE)
      strictEqual(abcdefghFileList.length, 0)
    })

    it('getFileListSync(createSuffixFilterFileCollector) Directory', () => {
      const jsFileList = getFileListSync(LIST_DIRECTORY, createSuffixFilterFileCollector('.js'))
      const abcdefghFileList = getFileListSync(LIST_DIRECTORY, createSuffixFilterFileCollector('.abcdefgh'))
      truthy(jsFileList.length >= 2)
      includes(jsFileList, LIST_FILE)
      strictEqual(abcdefghFileList.length, 0)
    })

    it('getFileListSync(createPrefixMapperFileCollector) File', () => {
      const fileList = getFileListSync(LIST_FILE, createPrefixMapperFileCollector('PREFIX-'))
      strictEqual(fileList.length, 1)
      strictEqual(fileList[ 0 ][ 0 ], LIST_FILE)
      includes(fileList[ 0 ][ 1 ], 'PREFIX-')
    })

    it('getFileListSync(createPrefixMapperFileCollector) Directory', () => {
      const fileList = getFileListSync(LIST_DIRECTORY, createPrefixMapperFileCollector('PREFIX-'))
      truthy(fileList.length >= 2)
      includes(fileList.map((v) => v[ 0 ]), LIST_FILE)
      truthy(fileList.every((v) => v[ 1 ].includes('PREFIX-')))
    })
  })
})
