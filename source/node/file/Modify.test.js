import nodeModulePath from 'path'
import { equal, throws } from 'assert'
import { FILE_TYPE, getPathType, createDirectory } from './File'
import {
  MODIFY_TYPE,
  modifyFile,
  modifyDirectory,

  getFileList,
  extnameFilterFileCollectorCreator,
  prefixMapperFileCollectorCreator,
  createGetPathFromRoot
} from './Modify'

const { describe, it, before, after } = global

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

describe('Node.File.Modify', () => {
  it('modifyFile() File', async () => {
    await modifyFile(MODIFY_TYPE.COPY, scriptFilePath0, scriptFilePath1)
    equal(await getPathType(scriptFilePath1), FILE_TYPE.File)
    await modifyFile(MODIFY_TYPE.MOVE, scriptFilePath1, scriptFilePath2)
    equal(await getPathType(scriptFilePath1), FILE_TYPE.Error)
    equal(await getPathType(scriptFilePath2), FILE_TYPE.File)
    await modifyFile(MODIFY_TYPE.DELETE, scriptFilePath2)
    equal(await getPathType(scriptFilePath2), FILE_TYPE.Error)
  })

  it('modifyFile() Directory', async () => {
    await modifyFile(MODIFY_TYPE.COPY, directoryPath0, directoryPath1)
    equal(await getPathType(directoryPath1), FILE_TYPE.Directory)
    await modifyFile(MODIFY_TYPE.MOVE, directoryPath1, directoryPath2)
    equal(await getPathType(directoryPath1), FILE_TYPE.Error)
    equal(await getPathType(directoryPath2), FILE_TYPE.Directory)
    await modifyFile(MODIFY_TYPE.DELETE, directoryPath2)
    equal(await getPathType(directoryPath2), FILE_TYPE.Error)
  })

  it('modifyFile.copy()/move()/delete() File', async () => {
    await modifyFile.copy(scriptFilePath0, scriptFilePath1)
    equal(await getPathType(scriptFilePath1), FILE_TYPE.File)
    await modifyFile.move(scriptFilePath1, scriptFilePath2)
    equal(await getPathType(scriptFilePath1), FILE_TYPE.Error)
    equal(await getPathType(scriptFilePath2), FILE_TYPE.File)
    await modifyFile.delete(scriptFilePath2)
    equal(await getPathType(scriptFilePath2), FILE_TYPE.Error)
  })

  it('modifyFile.copy()/move()/delete() Directory', async () => {
    await modifyFile.copy(directoryPath0, directoryPath1)
    equal(await getPathType(directoryPath1), FILE_TYPE.Directory)
    await modifyFile.move(directoryPath1, directoryPath2)
    equal(await getPathType(directoryPath1), FILE_TYPE.Error)
    equal(await getPathType(directoryPath2), FILE_TYPE.Directory)
    await modifyFile.delete(directoryPath2)
    equal(await getPathType(directoryPath2), FILE_TYPE.Error)
  })

  it('modifyDirectory() File', async () => {
    let getExpectedError = false
    try { await modifyDirectory(MODIFY_TYPE.COPY, scriptFilePath3, scriptFilePath1) } catch (error) { getExpectedError = true }
    equal(getExpectedError, true)

    getExpectedError = false
    try { await modifyDirectory(MODIFY_TYPE.MOVE, scriptFilePath3, scriptFilePath1) } catch (error) { getExpectedError = true }
    equal(getExpectedError, true)

    getExpectedError = false
    try { await modifyDirectory(MODIFY_TYPE.DELETE, scriptFilePath3) } catch (error) { getExpectedError = true }
    equal(getExpectedError, true)
  })

  it('modifyDirectory() Directory', async () => {
    await modifyDirectory(MODIFY_TYPE.COPY, directoryPath0, directoryPath1)
    equal(await getPathType(directoryPath1), FILE_TYPE.Directory)
    await modifyDirectory(MODIFY_TYPE.MOVE, directoryPath1, directoryPath2)
    equal(await getPathType(directoryPath1), FILE_TYPE.Error)
    equal(await getPathType(directoryPath2), FILE_TYPE.Directory)
    await modifyDirectory(MODIFY_TYPE.DELETE, directoryPath2)
    equal(await getPathType(directoryPath2), FILE_TYPE.Error)
  })

  it('modifyDirectory.copy()/move()/delete() File', async () => {
    let getExpectedError = false
    try { await modifyDirectory.copy(scriptFilePath3, scriptFilePath1) } catch (error) { getExpectedError = true }
    equal(getExpectedError, true)

    getExpectedError = false
    try { await modifyDirectory.move(scriptFilePath3, scriptFilePath1) } catch (error) { getExpectedError = true }
    equal(getExpectedError, true)

    getExpectedError = false
    try { await modifyDirectory.delete(scriptFilePath3) } catch (error) { getExpectedError = true }
    equal(getExpectedError, true)
  })

  it('modifyDirectory.copy()/move()/delete() Directory', async () => {
    await modifyDirectory.copy(directoryPath0, directoryPath1)
    equal(await getPathType(directoryPath1), FILE_TYPE.Directory)
    await modifyDirectory.move(directoryPath1, directoryPath2)
    equal(await getPathType(directoryPath1), FILE_TYPE.Error)
    equal(await getPathType(directoryPath2), FILE_TYPE.Directory)
    await modifyDirectory.delete(directoryPath2)
    equal(await getPathType(directoryPath2), FILE_TYPE.Error)
  })

  it('getFileList() File', async () => {
    const fileList = await getFileList(scriptFilePath0)
    equal(fileList.length, 1)
    equal(fileList[ 0 ], scriptFilePath0)
  })

  it('getFileList() Directory', async () => {
    const fileList = await getFileList(directoryPath0)
    equal(fileList.length >= 2, true)
    equal(fileList.includes(scriptFilePath0), true)
  })

  it('getFileList(extnameFilterFileCollectorCreator) File', async () => {
    const jsFileList = await getFileList(scriptFilePath0, extnameFilterFileCollectorCreator('.js'))
    const abcdefghFileList = await getFileList(scriptFilePath0, extnameFilterFileCollectorCreator('.abcdefgh'))
    equal(jsFileList.length, 1)
    equal(jsFileList[ 0 ], scriptFilePath0)
    equal(abcdefghFileList.length, 0)
  })

  it('getFileList(extnameFilterFileCollectorCreator) Directory', async () => {
    const jsFileList = await getFileList(directoryPath0, extnameFilterFileCollectorCreator('.js'))
    const abcdefghFileList = await getFileList(directoryPath0, extnameFilterFileCollectorCreator('.abcdefgh'))
    equal(jsFileList.length >= 2, true)
    equal(jsFileList.includes(scriptFilePath0), true)
    equal(abcdefghFileList.length, 0)
  })

  it('getFileList(prefixMapperFileCollectorCreator) File', async () => {
    const fileList = await getFileList(scriptFilePath0, prefixMapperFileCollectorCreator('PREFIX-'))
    equal(fileList.length, 1)
    equal(fileList[ 0 ][ 0 ], scriptFilePath0)
    equal(fileList[ 0 ][ 1 ].includes('PREFIX-'), true)
  })

  it('getFileList(prefixMapperFileCollectorCreator) Directory', async () => {
    const fileList = await getFileList(directoryPath0, prefixMapperFileCollectorCreator('PREFIX-'))
    equal(fileList.length >= 2, true)
    equal(fileList.map((v) => v[ 0 ]).includes(scriptFilePath0), true)
    equal(fileList.every((v) => v[ 1 ].includes('PREFIX-')), true)
  })

  it('createGetPathFromRoot()', () => {
    const checkPath = (getPathFromRoot, rootPath) => {
      const expectedPath = `${rootPath}/a/b/c`.replace(/\//g, nodeModulePath.sep)
      equal(getPathFromRoot('a/b/c'), expectedPath)
      equal(getPathFromRoot('./a/b/c'), expectedPath)
      equal(getPathFromRoot('a/d/../b/c'), expectedPath)
      throws(() => getPathFromRoot('..'), `should throw Error for to much '../'`)
      throws(() => getPathFromRoot('a/../../b'), `should throw Error for to much '../'`)
    }

    const getPathFromRoot0 = createGetPathFromRoot('/root/path/0/')
    const getPathFromRoot1 = createGetPathFromRoot('/root/../root/path/./1')
    const getPathFromRoot2 = createGetPathFromRoot('/root/path////2')

    checkPath(getPathFromRoot0, '/root/path/0')
    checkPath(getPathFromRoot1, '/root/path/1')
    checkPath(getPathFromRoot2, '/root/path/2')
  })
})
