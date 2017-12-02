import nodeModuleAssert from 'assert'
import nodeModulePath from 'path'
import {
  FILE_TYPE,

  getPathType,
  createDirectory,

  copyPath,
  movePath,
  deletePath
} from './File'

const { describe, it, before, after } = global

const TEST_ROOT = nodeModulePath.join(__dirname, '../../../test-file-gitignore/')

const invalidPath = '../../../../../../../../../../../../../../../../../../../../../../../../a/b/c/d/e/f/g'

const scriptFilePath0 = nodeModulePath.join(TEST_ROOT, '../example/resource/script.js')
const scriptFilePath1 = nodeModulePath.join(TEST_ROOT, 'script0.js')
const scriptFilePath2 = nodeModulePath.join(TEST_ROOT, 'script1.js')
const scriptFilePath3 = nodeModulePath.join(TEST_ROOT, 'script2.js')

const directoryPath0 = nodeModulePath.join(TEST_ROOT, '../example/node/')
const directoryPath1 = nodeModulePath.join(TEST_ROOT, '../example/node')

const directoryPath2 = nodeModulePath.join(TEST_ROOT, 'a/b/c/')
const directoryPath3 = nodeModulePath.join(TEST_ROOT, 'a/b/c/d/')
const directoryPath4 = nodeModulePath.join(TEST_ROOT, 'a/b/c/d/e/')

const directoryPath5 = nodeModulePath.join(TEST_ROOT, 'a/e0/')
const directoryPath6 = nodeModulePath.join(TEST_ROOT, 'a/e1/')

const directoryPath7 = nodeModulePath.join(TEST_ROOT, 'a/b/')
const directoryPath8 = nodeModulePath.join(TEST_ROOT, 'a/')

before('prepare', () => createDirectory(TEST_ROOT))
after('clear', async () => {
  await deletePath(scriptFilePath3)
  await deletePath(directoryPath6)
  await deletePath(directoryPath7)
  await deletePath(directoryPath8)
  await deletePath(TEST_ROOT)
})

describe('Node.File.File', () => {
  it('getPathType()', async () => {
    nodeModuleAssert.equal(await getPathType(scriptFilePath0), FILE_TYPE.File)
    nodeModuleAssert.equal(await getPathType(directoryPath0), FILE_TYPE.Directory)
    nodeModuleAssert.equal(await getPathType(directoryPath1), FILE_TYPE.Directory)
    nodeModuleAssert.equal(await getPathType(invalidPath), FILE_TYPE.Error)
  })

  it('createDirectory()', async () => {
    await createDirectory(directoryPath4)
    await createDirectory(directoryPath2)
    await createDirectory(directoryPath3)
    nodeModuleAssert.equal(await getPathType(directoryPath2), FILE_TYPE.Directory)
    nodeModuleAssert.equal(await getPathType(directoryPath3), FILE_TYPE.Directory)
    nodeModuleAssert.equal(await getPathType(directoryPath4), FILE_TYPE.Directory)

    let getExpectedError = false
    try { await createDirectory(scriptFilePath0) } catch (error) { getExpectedError = true }
    nodeModuleAssert.equal(getExpectedError, true)
  })

  it('copyPath()', async () => {
    await copyPath(scriptFilePath0, scriptFilePath1)
    nodeModuleAssert.equal(await getPathType(scriptFilePath1), FILE_TYPE.File)

    let getExpectedError = false
    try { await copyPath(TEST_ROOT, invalidPath) } catch (error) { getExpectedError = true }
    nodeModuleAssert.equal(getExpectedError, true)

    await copyPath(scriptFilePath0, scriptFilePath2)
    await copyPath(scriptFilePath0, scriptFilePath2)

    await copyPath(directoryPath4, directoryPath5)
    await copyPath(directoryPath4, directoryPath5)

    nodeModuleAssert.equal(await getPathType(scriptFilePath2), FILE_TYPE.File)
    nodeModuleAssert.equal(await getPathType(directoryPath5), FILE_TYPE.Directory)
  })

  it('movePath()', async () => {
    let getExpectedError = false
    try { await movePath(invalidPath, TEST_ROOT) } catch (error) { getExpectedError = true }
    nodeModuleAssert.equal(getExpectedError, true)

    await movePath(scriptFilePath2, scriptFilePath3)
    await movePath(directoryPath5, directoryPath6)

    nodeModuleAssert.equal(await getPathType(scriptFilePath2), FILE_TYPE.Error)
    nodeModuleAssert.equal(await getPathType(directoryPath5), FILE_TYPE.Error)
    nodeModuleAssert.equal(await getPathType(scriptFilePath3), FILE_TYPE.File)
    nodeModuleAssert.equal(await getPathType(directoryPath6), FILE_TYPE.Directory)
  })

  it('deletePath()', async () => {
    let getExpectedError = false
    try { await deletePath(TEST_ROOT) } catch (error) { getExpectedError = true }
    nodeModuleAssert.equal(getExpectedError, true)

    await deletePath(directoryPath4)
    await deletePath(directoryPath3)
    await deletePath(directoryPath2)
    await deletePath(scriptFilePath1)

    nodeModuleAssert.equal(await getPathType(scriptFilePath1), FILE_TYPE.Error)
  })
})
