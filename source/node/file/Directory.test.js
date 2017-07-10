import nodeModuleAssert from 'assert'
import nodeModulePath from 'path'
import {
  FILE_TYPE,
  createDirectory,
  deletePath
} from './File'
import {
  getDirectoryContentNameList,
  getDirectoryContentFileList,

  getDirectoryContent,
  walkDirectoryContent,
  walkDirectoryContentBottomUp,
  walkDirectoryContentShallow,

  copyDirectoryContent,
  moveDirectoryContent,
  deleteDirectoryContent
} from './Directory'

const { describe, it, before, after } = global
global.__DEV__ = false

const TEST_ROOT = nodeModulePath.join(__dirname, '../../../test-directory/')

const invalidPath = '../../../../../../../../../../../../../../../../../../../../../../../../a/b/c/d/e/f/g'

const scriptFilePath0 = nodeModulePath.join(TEST_ROOT, '../example/node/script.js')

const directoryPath0 = nodeModulePath.join(TEST_ROOT, '../example/node/')
const directoryPath1 = nodeModulePath.join(TEST_ROOT, '../example/')

const directoryPath2 = nodeModulePath.join(TEST_ROOT, 'a/b/c/d/e/')
const directoryPath3 = nodeModulePath.join(TEST_ROOT, '1/2/3/4/5/')
const directoryPath4 = nodeModulePath.join(TEST_ROOT, '1/')
const directoryPath5 = nodeModulePath.join(TEST_ROOT, 'a/')
const directoryPath6 = nodeModulePath.join(TEST_ROOT, 'a0/')
const directoryPath7 = nodeModulePath.join(TEST_ROOT, 'a1/')

before('prepare', async () => {
  await createDirectory(TEST_ROOT)
  await createDirectory(directoryPath2)
  await createDirectory(directoryPath3)
})

after('clear', async () => {
  await deleteDirectoryContent(await getDirectoryContent(TEST_ROOT))
  await deletePath(TEST_ROOT)
})

describe('Node.File.Directory', () => {
  it('getDirectoryContentNameList()', async () => {
    let getExpectedError = false
    try { await getDirectoryContentNameList(invalidPath) } catch (error) { getExpectedError = true }
    nodeModuleAssert.equal(getExpectedError, true)

    getExpectedError = false
    try { await getDirectoryContentNameList(scriptFilePath0) } catch (error) { getExpectedError = true }
    nodeModuleAssert.equal(getExpectedError, true)

    await getDirectoryContentNameList(directoryPath0)
    await getDirectoryContentNameList(directoryPath1)
    await getDirectoryContentNameList(TEST_ROOT)
  })

  it('getDirectoryContentFileList()', async () => {
    let getExpectedError = false
    try { await getDirectoryContentFileList(invalidPath) } catch (error) { getExpectedError = true }
    nodeModuleAssert.equal(getExpectedError, true)

    getExpectedError = false
    try { await getDirectoryContentFileList(scriptFilePath0) } catch (error) { getExpectedError = true }
    nodeModuleAssert.equal(getExpectedError, true)

    await getDirectoryContentFileList(directoryPath0)
    await getDirectoryContentFileList(directoryPath1)
    const fileList = await getDirectoryContentFileList(TEST_ROOT)
    nodeModuleAssert.equal(fileList.length, 0)
  })

  it('getDirectoryContent()', async () => {
    let getExpectedError = false
    try { await getDirectoryContent(invalidPath) } catch (error) { getExpectedError = true }
    nodeModuleAssert.equal(getExpectedError, true)

    getExpectedError = false
    try { await getDirectoryContent(scriptFilePath0) } catch (error) { getExpectedError = true }
    nodeModuleAssert.equal(getExpectedError, true)

    await getDirectoryContent(directoryPath0)
    await getDirectoryContent(directoryPath1)
    const content = await getDirectoryContent(TEST_ROOT)

    // console.log(content)

    nodeModuleAssert.equal(content[ FILE_TYPE.Directory ].size, 2)
    nodeModuleAssert.equal(content[ FILE_TYPE.File ].length, 0)
    nodeModuleAssert.equal(content[ FILE_TYPE.SymbolicLink ].length, 0)
    nodeModuleAssert.equal(content[ FILE_TYPE.Other ].length, 0)
  })

  it('walkDirectoryContent()', async () => {
    let callbackCount = 0
    await walkDirectoryContent(await getDirectoryContent(TEST_ROOT), (path, name, fileType) => {
      // console.log({ path, name, fileType })
      callbackCount++
    })
    nodeModuleAssert.equal(callbackCount, 10)

    const checkNameList = '2345'.split('')
    await walkDirectoryContent(await getDirectoryContent(directoryPath4), (path, name, fileType) => {
      // console.log({ path, name, fileType })
      nodeModuleAssert.equal(name, checkNameList.shift())
    })
  })

  it('walkDirectoryContentBottomUp()', async () => {
    let callbackCount = 0
    await walkDirectoryContentBottomUp(await getDirectoryContent(TEST_ROOT), (path, name, fileType) => {
      // console.log({ path, name, fileType })
      callbackCount++
    })
    nodeModuleAssert.equal(callbackCount, 10)

    const checkNameList = '2345'.split('')
    await walkDirectoryContentBottomUp(await getDirectoryContent(directoryPath4), (path, name, fileType) => {
      // console.log({ path, name, fileType })
      nodeModuleAssert.equal(name, checkNameList.pop())
    })
  })

  it('walkDirectoryContentShallow()', async () => {
    let callbackCount = 0
    await walkDirectoryContentShallow(await getDirectoryContent(TEST_ROOT), (path, name, fileType) => {
      // console.log({ path, name, fileType })
      callbackCount++
    })
    nodeModuleAssert.equal(callbackCount, 2)

    await walkDirectoryContentShallow(await getDirectoryContent(directoryPath4), (path, name, fileType) => {
      // console.log({ path, name, fileType })
      nodeModuleAssert.equal(name, '2')
    })
  })

  it('copyDirectoryContent()', async () => {
    await copyDirectoryContent(await getDirectoryContent(directoryPath5), directoryPath6)

    let callbackCount = 0
    await walkDirectoryContent(await getDirectoryContent(directoryPath6), (path, name, fileType) => {
      // console.log({ path, name, fileType })
      callbackCount++
    })
    nodeModuleAssert.equal(callbackCount, 4)
  })

  it('moveDirectoryContent()', async () => {
    await moveDirectoryContent(await getDirectoryContent(directoryPath6), directoryPath7)

    let callbackCount = 0
    await walkDirectoryContent(await getDirectoryContent(directoryPath7), (path, name, fileType) => {
      // console.log({ path, name, fileType })
      callbackCount++
    })
    nodeModuleAssert.equal(callbackCount, 4)
  })

  it('deleteDirectoryContent()', async () => {
    await deleteDirectoryContent(await getDirectoryContent(directoryPath7), directoryPath7)

    let callbackCount = 0
    await walkDirectoryContent(await getDirectoryContent(directoryPath7), (path, name, fileType) => {
      console.log({ path, name, fileType })
      callbackCount++
    })
    nodeModuleAssert.equal(callbackCount, 0)
  })
})
