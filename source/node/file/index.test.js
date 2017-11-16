import nodeModuleAssert from 'assert'
import nodeModulePath from 'path'
import {
  FILE_TYPE,
  getPathType,
  createDirectory,

  MODIFY_TYPE,
  modifyFile,
  modifyDirectory,

  getFileList,
  extnameFilterFileCollectorCreator,
  prefixMapperFileCollectorCreator
} from './index'

const { describe, it, before, after } = global
global.__DEV__ = false

const TEST_ROOT = nodeModulePath.join(__dirname, '../../../test-index-gitignore/')

const scriptFilePath0 = nodeModulePath.join(TEST_ROOT, '../example/resource/script.js')
const scriptFilePath1 = nodeModulePath.join(TEST_ROOT, 'script0.js')
const scriptFilePath2 = nodeModulePath.join(TEST_ROOT, 'script1.js')
const scriptFilePath3 = nodeModulePath.join(TEST_ROOT, 'script2.js')

const directoryPath0 = nodeModulePath.join(TEST_ROOT, '../example/')
const directoryPath1 = nodeModulePath.join(TEST_ROOT, 'example0/')
const directoryPath2 = nodeModulePath.join(TEST_ROOT, 'example1/')

before('prepare', async () => {
  await createDirectory(TEST_ROOT)
  await modifyFile.copy(scriptFilePath0, scriptFilePath3)
})

after('clear', async () => {
  await modifyDirectory.delete(TEST_ROOT)
})

describe('Node.File.index', () => {
  it('modifyFile() File', async () => {
    await modifyFile(MODIFY_TYPE.COPY, scriptFilePath0, scriptFilePath1)
    nodeModuleAssert.equal(await getPathType(scriptFilePath1), FILE_TYPE.File)
    await modifyFile(MODIFY_TYPE.MOVE, scriptFilePath1, scriptFilePath2)
    nodeModuleAssert.equal(await getPathType(scriptFilePath1), FILE_TYPE.Error)
    nodeModuleAssert.equal(await getPathType(scriptFilePath2), FILE_TYPE.File)
    await modifyFile(MODIFY_TYPE.DELETE, scriptFilePath2)
    nodeModuleAssert.equal(await getPathType(scriptFilePath2), FILE_TYPE.Error)
  })

  it('modifyFile() Directory', async () => {
    await modifyFile(MODIFY_TYPE.COPY, directoryPath0, directoryPath1)
    nodeModuleAssert.equal(await getPathType(directoryPath1), FILE_TYPE.Directory)
    await modifyFile(MODIFY_TYPE.MOVE, directoryPath1, directoryPath2)
    nodeModuleAssert.equal(await getPathType(directoryPath1), FILE_TYPE.Error)
    nodeModuleAssert.equal(await getPathType(directoryPath2), FILE_TYPE.Directory)
    await modifyFile(MODIFY_TYPE.DELETE, directoryPath2)
    nodeModuleAssert.equal(await getPathType(directoryPath2), FILE_TYPE.Error)
  })

  it('modifyFile.copy()/move()/delete() File', async () => {
    await modifyFile.copy(scriptFilePath0, scriptFilePath1)
    nodeModuleAssert.equal(await getPathType(scriptFilePath1), FILE_TYPE.File)
    await modifyFile.move(scriptFilePath1, scriptFilePath2)
    nodeModuleAssert.equal(await getPathType(scriptFilePath1), FILE_TYPE.Error)
    nodeModuleAssert.equal(await getPathType(scriptFilePath2), FILE_TYPE.File)
    await modifyFile.delete(scriptFilePath2)
    nodeModuleAssert.equal(await getPathType(scriptFilePath2), FILE_TYPE.Error)
  })

  it('modifyFile.copy()/move()/delete() Directory', async () => {
    await modifyFile.copy(directoryPath0, directoryPath1)
    nodeModuleAssert.equal(await getPathType(directoryPath1), FILE_TYPE.Directory)
    await modifyFile.move(directoryPath1, directoryPath2)
    nodeModuleAssert.equal(await getPathType(directoryPath1), FILE_TYPE.Error)
    nodeModuleAssert.equal(await getPathType(directoryPath2), FILE_TYPE.Directory)
    await modifyFile.delete(directoryPath2)
    nodeModuleAssert.equal(await getPathType(directoryPath2), FILE_TYPE.Error)
  })

  it('modifyDirectory() File', async () => {
    let getExpectedError = false
    try { await modifyDirectory(MODIFY_TYPE.COPY, scriptFilePath3, scriptFilePath1) } catch (error) { getExpectedError = true }
    nodeModuleAssert.equal(getExpectedError, true)

    getExpectedError = false
    try { await modifyDirectory(MODIFY_TYPE.MOVE, scriptFilePath3, scriptFilePath1) } catch (error) { getExpectedError = true }
    nodeModuleAssert.equal(getExpectedError, true)

    getExpectedError = false
    try { await modifyDirectory(MODIFY_TYPE.DELETE, scriptFilePath3) } catch (error) { getExpectedError = true }
    nodeModuleAssert.equal(getExpectedError, true)
  })

  it('modifyDirectory() Directory', async () => {
    await modifyDirectory(MODIFY_TYPE.COPY, directoryPath0, directoryPath1)
    nodeModuleAssert.equal(await getPathType(directoryPath1), FILE_TYPE.Directory)
    await modifyDirectory(MODIFY_TYPE.MOVE, directoryPath1, directoryPath2)
    nodeModuleAssert.equal(await getPathType(directoryPath1), FILE_TYPE.Error)
    nodeModuleAssert.equal(await getPathType(directoryPath2), FILE_TYPE.Directory)
    await modifyDirectory(MODIFY_TYPE.DELETE, directoryPath2)
    nodeModuleAssert.equal(await getPathType(directoryPath2), FILE_TYPE.Error)
  })

  it('modifyDirectory.copy()/move()/delete() File', async () => {
    let getExpectedError = false
    try { await modifyDirectory.copy(scriptFilePath3, scriptFilePath1) } catch (error) { getExpectedError = true }
    nodeModuleAssert.equal(getExpectedError, true)

    getExpectedError = false
    try { await modifyDirectory.move(scriptFilePath3, scriptFilePath1) } catch (error) { getExpectedError = true }
    nodeModuleAssert.equal(getExpectedError, true)

    getExpectedError = false
    try { await modifyDirectory.delete(scriptFilePath3) } catch (error) { getExpectedError = true }
    nodeModuleAssert.equal(getExpectedError, true)
  })

  it('modifyDirectory.copy()/move()/delete() Directory', async () => {
    await modifyDirectory.copy(directoryPath0, directoryPath1)
    nodeModuleAssert.equal(await getPathType(directoryPath1), FILE_TYPE.Directory)
    await modifyDirectory.move(directoryPath1, directoryPath2)
    nodeModuleAssert.equal(await getPathType(directoryPath1), FILE_TYPE.Error)
    nodeModuleAssert.equal(await getPathType(directoryPath2), FILE_TYPE.Directory)
    await modifyDirectory.delete(directoryPath2)
    nodeModuleAssert.equal(await getPathType(directoryPath2), FILE_TYPE.Error)
  })

  it('getFileList() File', async () => {
    const fileList = await getFileList(scriptFilePath0)
    nodeModuleAssert.equal(fileList.length, 1)
    nodeModuleAssert.equal(fileList[ 0 ], scriptFilePath0)
  })

  it('getFileList() Directory', async () => {
    const fileList = await getFileList(directoryPath0)
    nodeModuleAssert.equal(fileList.length >= 2, true)
    nodeModuleAssert.equal(fileList.includes(scriptFilePath0), true)
  })

  it('getFileList(extnameFilterFileCollectorCreator) File', async () => {
    const jsFileList = await getFileList(scriptFilePath0, extnameFilterFileCollectorCreator('.js'))
    const abcdefghFileList = await getFileList(scriptFilePath0, extnameFilterFileCollectorCreator('.abcdefgh'))
    nodeModuleAssert.equal(jsFileList.length, 1)
    nodeModuleAssert.equal(jsFileList[ 0 ], scriptFilePath0)
    nodeModuleAssert.equal(abcdefghFileList.length, 0)
  })

  it('getFileList(extnameFilterFileCollectorCreator) Directory', async () => {
    const jsFileList = await getFileList(directoryPath0, extnameFilterFileCollectorCreator('.js'))
    const abcdefghFileList = await getFileList(directoryPath0, extnameFilterFileCollectorCreator('.abcdefgh'))
    nodeModuleAssert.equal(jsFileList.length >= 2, true)
    nodeModuleAssert.equal(jsFileList.includes(scriptFilePath0), true)
    nodeModuleAssert.equal(abcdefghFileList.length, 0)
  })

  it('getFileList(prefixMapperFileCollectorCreator) File', async () => {
    const fileList = await getFileList(scriptFilePath0, prefixMapperFileCollectorCreator('PREFIX-'))
    nodeModuleAssert.equal(fileList.length, 1)
    nodeModuleAssert.equal(fileList[ 0 ][ 0 ], scriptFilePath0)
    nodeModuleAssert.equal(fileList[ 0 ][ 1 ].includes('PREFIX-'), true)
  })

  it('getFileList(prefixMapperFileCollectorCreator) Directory', async () => {
    const fileList = await getFileList(directoryPath0, prefixMapperFileCollectorCreator('PREFIX-'))
    nodeModuleAssert.equal(fileList.length >= 2, true)
    nodeModuleAssert.equal(fileList.map((v) => v[ 0 ]).includes(scriptFilePath0), true)
    nodeModuleAssert.equal(fileList.every((v) => v[ 1 ].includes('PREFIX-')), true)
  })
})
