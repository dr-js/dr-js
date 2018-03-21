import { equal } from 'assert'
import { join as joinPath, resolve } from 'path'
import { FILE_TYPE, createDirectory, deletePath } from './File'
import {
  getDirectoryContentNameList,
  getDirectoryContent,
  getDirectoryContentShallow,
  walkDirectoryContent,
  walkDirectoryContentBottomUp,
  walkDirectoryContentShallow,
  copyDirectoryContent,
  moveDirectoryContent,
  deleteDirectoryContent,
  getFileList
} from './Directory'

const { describe, it, before, after } = global

const TEST_ROOT = resolve(__dirname, './test-directory-gitignore/')
const SOURCE_FILE = resolve(__dirname, './function.js')
const SOURCE_DIRECTORY = resolve(__dirname, '../module/')
const SOURCE_DIRECTORY_UPPER = resolve(__dirname, '../')

const invalidPath = '../../../../../../../../../../../../../../../../../../../../../../../../a/b/c/d/e/f/g'

const directoryPath0 = resolve(TEST_ROOT, 'a/b/c/d/e/')
const directoryPath1 = resolve(TEST_ROOT, '1/2/3/4/5/')
const directoryPath2 = resolve(TEST_ROOT, '1/')
const directoryPath3 = resolve(TEST_ROOT, 'a/')
const directoryPath4 = resolve(TEST_ROOT, 'a0/')
const directoryPath5 = resolve(TEST_ROOT, 'a1/')

before('prepare', async () => {
  await createDirectory(TEST_ROOT)
  await createDirectory(directoryPath0)
  await createDirectory(directoryPath1)
})

after('clear', async () => {
  await deleteDirectoryContent(await getDirectoryContent(TEST_ROOT))
  await deletePath(TEST_ROOT)
})

describe('Node.File.Directory', () => {
  it('getDirectoryContentNameList()', async () => {
    let getExpectedError = false
    try { await getDirectoryContentNameList(invalidPath) } catch (error) { getExpectedError = true }
    equal(getExpectedError, true)

    getExpectedError = false
    try { await getDirectoryContentNameList(SOURCE_FILE) } catch (error) { getExpectedError = true }
    equal(getExpectedError, true)

    await getDirectoryContentNameList(SOURCE_DIRECTORY)
    await getDirectoryContentNameList(SOURCE_DIRECTORY_UPPER)
    await getDirectoryContentNameList(TEST_ROOT)
  })

  it('getDirectoryContent()', async () => {
    let getExpectedError = false
    try { await getDirectoryContent(invalidPath) } catch (error) { getExpectedError = true }
    equal(getExpectedError, true)

    getExpectedError = false
    try { await getDirectoryContent(SOURCE_FILE) } catch (error) { getExpectedError = true }
    equal(getExpectedError, true)

    await getDirectoryContent(SOURCE_DIRECTORY)
    await getDirectoryContent(SOURCE_DIRECTORY_UPPER)
    const content = await getDirectoryContent(TEST_ROOT)

    // console.log(content)

    equal(content[ FILE_TYPE.Directory ].size, 2)
    equal(content[ FILE_TYPE.File ].length, 0)
    equal(content[ FILE_TYPE.SymbolicLink ].length, 0)
    equal(content[ FILE_TYPE.Other ].length, 0)
  })

  it('getDirectoryContentShallow()', async () => {
    let getExpectedError = false
    try { await getDirectoryContentShallow(invalidPath) } catch (error) { getExpectedError = true }
    equal(getExpectedError, true)

    getExpectedError = false
    try { await getDirectoryContentShallow(SOURCE_FILE) } catch (error) { getExpectedError = true }
    equal(getExpectedError, true)

    await getDirectoryContentShallow(SOURCE_DIRECTORY)
    await getDirectoryContentShallow(SOURCE_DIRECTORY_UPPER)
    const content = await getDirectoryContentShallow(TEST_ROOT)

    // console.log(content)

    equal(content[ FILE_TYPE.Directory ].size, 2)
    equal(content[ FILE_TYPE.File ].length, 0)
    equal(content[ FILE_TYPE.SymbolicLink ].length, 0)
    equal(content[ FILE_TYPE.Other ].length, 0)
  })

  it('walkDirectoryContent()', async () => {
    let callbackCount = 0
    await walkDirectoryContent(await getDirectoryContent(TEST_ROOT), (path, name, fileType) => {
      // console.log({ path, name, fileType })
      callbackCount++
    })
    equal(callbackCount, 10)

    const checkNameList = '2345'.split('')
    await walkDirectoryContent(await getDirectoryContent(directoryPath2), (path, name, fileType) => {
      // console.log({ path, name, fileType })
      equal(name, checkNameList.shift())
    })
  })

  it('walkDirectoryContentBottomUp()', async () => {
    let callbackCount = 0
    await walkDirectoryContentBottomUp(await getDirectoryContent(TEST_ROOT), (path, name, fileType) => {
      // console.log({ path, name, fileType })
      callbackCount++
    })
    equal(callbackCount, 10)

    const checkNameList = '2345'.split('')
    await walkDirectoryContentBottomUp(await getDirectoryContent(directoryPath2), (path, name, fileType) => {
      // console.log({ path, name, fileType })
      equal(name, checkNameList.pop())
    })
  })

  it('walkDirectoryContentShallow()', async () => {
    let callbackCount = 0
    await walkDirectoryContentShallow(await getDirectoryContent(TEST_ROOT), (path, name, fileType) => {
      // console.log({ path, name, fileType })
      callbackCount++
    })
    equal(callbackCount, 2)

    await walkDirectoryContentShallow(await getDirectoryContent(directoryPath2), (path, name, fileType) => {
      // console.log({ path, name, fileType })
      equal(name, '2')
    })
  })

  it('copyDirectoryContent()', async () => {
    await copyDirectoryContent(await getDirectoryContent(directoryPath3), directoryPath4)

    let callbackCount = 0
    await walkDirectoryContent(await getDirectoryContent(directoryPath4), (path, name, fileType) => {
      // console.log({ path, name, fileType })
      callbackCount++
    })
    equal(callbackCount, 4)
  })

  it('moveDirectoryContent()', async () => {
    await moveDirectoryContent(await getDirectoryContentShallow(directoryPath4), directoryPath5)

    let callbackCount = 0
    await walkDirectoryContent(await getDirectoryContent(directoryPath5), (path, name, fileType) => {
      // console.log({ path, name, fileType })
      callbackCount++
    })
    equal(callbackCount, 4)
  })

  it('deleteDirectoryContent()', async () => {
    await deleteDirectoryContent(await getDirectoryContent(directoryPath5), directoryPath5)

    let callbackCount = 0
    await walkDirectoryContent(await getDirectoryContent(directoryPath5), (path, name, fileType) => {
      // console.log({ path, name, fileType })
      callbackCount++
    })
    equal(callbackCount, 0)
  })

  describe('getFileList()', () => {
    const LIST_FILE = resolve(__dirname, './function.js')
    const LIST_DIRECTORY = resolve(__dirname, '../')

    const createSuffixFilterFileCollector = (suffix) => (fileList, path, name) => name.endsWith(suffix) && fileList.push(joinPath(path, name))
    const createPrefixMapperFileCollector = (prefix) => (fileList, path, name) => fileList.push([
      joinPath(path, name),
      joinPath(path, prefix + name)
    ])

    it('getFileList() File', async () => {
      const fileList = await getFileList(LIST_FILE)
      equal(fileList.length, 1)
      equal(fileList[ 0 ], LIST_FILE)
    })

    it('getFileList() Directory', async () => {
      const fileList = await getFileList(LIST_DIRECTORY)
      equal(fileList.length >= 2, true)
      equal(fileList.includes(LIST_FILE), true)
    })

    it('getFileList(createSuffixFilterFileCollector) File', async () => {
      const jsFileList = await getFileList(LIST_FILE, createSuffixFilterFileCollector('.js'))
      const abcdefghFileList = await getFileList(LIST_FILE, createSuffixFilterFileCollector('.abcdefgh'))
      equal(jsFileList.length, 1)
      equal(jsFileList[ 0 ], LIST_FILE)
      equal(abcdefghFileList.length, 0)
    })

    it('getFileList(createSuffixFilterFileCollector) Directory', async () => {
      const jsFileList = await getFileList(LIST_DIRECTORY, createSuffixFilterFileCollector('.js'))
      const abcdefghFileList = await getFileList(LIST_DIRECTORY, createSuffixFilterFileCollector('.abcdefgh'))
      equal(jsFileList.length >= 2, true)
      equal(jsFileList.includes(LIST_FILE), true)
      equal(abcdefghFileList.length, 0)
    })

    it('getFileList(createPrefixMapperFileCollector) File', async () => {
      const fileList = await getFileList(LIST_FILE, createPrefixMapperFileCollector('PREFIX-'))
      equal(fileList.length, 1)
      equal(fileList[ 0 ][ 0 ], LIST_FILE)
      equal(fileList[ 0 ][ 1 ].includes('PREFIX-'), true)
    })

    it('getFileList(createPrefixMapperFileCollector) Directory', async () => {
      const fileList = await getFileList(LIST_DIRECTORY, createPrefixMapperFileCollector('PREFIX-'))
      equal(fileList.length >= 2, true)
      equal(fileList.map((v) => v[ 0 ]).includes(LIST_FILE), true)
      equal(fileList.every((v) => v[ 1 ].includes('PREFIX-')), true)
    })
  })
})
