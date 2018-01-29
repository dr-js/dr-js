import { join as joinPath, resolve, sep as sepPath } from 'path'
import { equal, throws } from 'assert'
import { createGetPathFromRoot } from './__utils__'
import { FILE_TYPE, getPathType, createDirectory } from './File'
import { getFileList } from './Directory'
import { MODIFY_TYPE, modifyFile, modifyDirectory } from './Modify'

const { describe, it, before, after } = global

const TEST_ROOT = resolve(__dirname, './test-modify-gitignore/')
const SOURCE_FILE = resolve(__dirname, './__utils__.js')
const SOURCE_DIRECTORY = resolve(__dirname, '../')

const filePath0 = resolve(TEST_ROOT, 'file0.js')
const filePath1 = resolve(TEST_ROOT, 'file1.js')
const filePath2 = resolve(TEST_ROOT, 'file2.js')

const directoryPath0 = resolve(TEST_ROOT, 'directory0/')
const directoryPath1 = resolve(TEST_ROOT, 'directory1/')

before('prepare', async () => {
  await createDirectory(TEST_ROOT)
  await modifyFile.copy(SOURCE_FILE, filePath2)
})

after('clear', async () => {
  await modifyDirectory.delete(TEST_ROOT)
})

const createSuffixFilterFileCollector = (suffix) => (fileList, path, name) => name.endsWith(suffix) && fileList.push(joinPath(path, name))
const createPrefixMapperFileCollector = (prefix) => (fileList, path, name) => fileList.push([
  joinPath(path, name),
  joinPath(path, prefix + name)
])

describe('Node.File.Modify', () => {
  it('modifyFile() File', async () => {
    await modifyFile(MODIFY_TYPE.COPY, SOURCE_FILE, filePath0)
    equal(await getPathType(filePath0), FILE_TYPE.File)
    await modifyFile(MODIFY_TYPE.MOVE, filePath0, filePath1)
    equal(await getPathType(filePath0), FILE_TYPE.Error)
    equal(await getPathType(filePath1), FILE_TYPE.File)
    await modifyFile(MODIFY_TYPE.DELETE, filePath1)
    equal(await getPathType(filePath1), FILE_TYPE.Error)
  })

  it('modifyFile() Directory', async () => {
    await modifyFile(MODIFY_TYPE.COPY, SOURCE_DIRECTORY, directoryPath0)
    equal(await getPathType(directoryPath0), FILE_TYPE.Directory)
    await modifyFile(MODIFY_TYPE.MOVE, directoryPath0, directoryPath1)
    equal(await getPathType(directoryPath0), FILE_TYPE.Error)
    equal(await getPathType(directoryPath1), FILE_TYPE.Directory)
    await modifyFile(MODIFY_TYPE.DELETE, directoryPath1)
    equal(await getPathType(directoryPath1), FILE_TYPE.Error)
  })

  it('modifyFile.copy()/move()/delete() File', async () => {
    await modifyFile.copy(SOURCE_FILE, filePath0)
    equal(await getPathType(filePath0), FILE_TYPE.File)
    await modifyFile.move(filePath0, filePath1)
    equal(await getPathType(filePath0), FILE_TYPE.Error)
    equal(await getPathType(filePath1), FILE_TYPE.File)
    await modifyFile.delete(filePath1)
    equal(await getPathType(filePath1), FILE_TYPE.Error)
  })

  it('modifyFile.copy()/move()/delete() Directory', async () => {
    await modifyFile.copy(SOURCE_DIRECTORY, directoryPath0)
    equal(await getPathType(directoryPath0), FILE_TYPE.Directory)
    await modifyFile.move(directoryPath0, directoryPath1)
    equal(await getPathType(directoryPath0), FILE_TYPE.Error)
    equal(await getPathType(directoryPath1), FILE_TYPE.Directory)
    await modifyFile.delete(directoryPath1)
    equal(await getPathType(directoryPath1), FILE_TYPE.Error)
  })

  it('modifyDirectory() File', async () => {
    let getExpectedError = false
    try { await modifyDirectory(MODIFY_TYPE.COPY, filePath2, filePath0) } catch (error) { getExpectedError = true }
    equal(getExpectedError, true)

    getExpectedError = false
    try { await modifyDirectory(MODIFY_TYPE.MOVE, filePath2, filePath0) } catch (error) { getExpectedError = true }
    equal(getExpectedError, true)

    getExpectedError = false
    try { await modifyDirectory(MODIFY_TYPE.DELETE, filePath2) } catch (error) { getExpectedError = true }
    equal(getExpectedError, true)
  })

  it('modifyDirectory() Directory', async () => {
    await modifyDirectory(MODIFY_TYPE.COPY, SOURCE_DIRECTORY, directoryPath0)
    equal(await getPathType(directoryPath0), FILE_TYPE.Directory)
    await modifyDirectory(MODIFY_TYPE.MOVE, directoryPath0, directoryPath1)
    equal(await getPathType(directoryPath0), FILE_TYPE.Error)
    equal(await getPathType(directoryPath1), FILE_TYPE.Directory)
    await modifyDirectory(MODIFY_TYPE.DELETE, directoryPath1)
    equal(await getPathType(directoryPath1), FILE_TYPE.Error)
  })

  it('modifyDirectory.copy()/move()/delete() File', async () => {
    let getExpectedError = false
    try { await modifyDirectory.copy(filePath2, filePath0) } catch (error) { getExpectedError = true }
    equal(getExpectedError, true)

    getExpectedError = false
    try { await modifyDirectory.move(filePath2, filePath0) } catch (error) { getExpectedError = true }
    equal(getExpectedError, true)

    getExpectedError = false
    try { await modifyDirectory.delete(filePath2) } catch (error) { getExpectedError = true }
    equal(getExpectedError, true)
  })

  it('modifyDirectory.copy()/move()/delete() Directory', async () => {
    await modifyDirectory.copy(SOURCE_DIRECTORY, directoryPath0)
    equal(await getPathType(directoryPath0), FILE_TYPE.Directory)
    await modifyDirectory.move(directoryPath0, directoryPath1)
    equal(await getPathType(directoryPath0), FILE_TYPE.Error)
    equal(await getPathType(directoryPath1), FILE_TYPE.Directory)
    await modifyDirectory.delete(directoryPath1)
    equal(await getPathType(directoryPath1), FILE_TYPE.Error)
  })

  it('getFileList() File', async () => {
    const fileList = await getFileList(SOURCE_FILE)
    equal(fileList.length, 1)
    equal(fileList[ 0 ], SOURCE_FILE)
  })

  it('getFileList() Directory', async () => {
    const fileList = await getFileList(SOURCE_DIRECTORY)
    equal(fileList.length >= 2, true)
    equal(fileList.includes(SOURCE_FILE), true)
  })

  it('getFileList(createSuffixFilterFileCollector) File', async () => {
    const jsFileList = await getFileList(SOURCE_FILE, createSuffixFilterFileCollector('.js'))
    const abcdefghFileList = await getFileList(SOURCE_FILE, createSuffixFilterFileCollector('.abcdefgh'))
    equal(jsFileList.length, 1)
    equal(jsFileList[ 0 ], SOURCE_FILE)
    equal(abcdefghFileList.length, 0)
  })

  it('getFileList(createSuffixFilterFileCollector) Directory', async () => {
    const jsFileList = await getFileList(SOURCE_DIRECTORY, createSuffixFilterFileCollector('.js'))
    const abcdefghFileList = await getFileList(SOURCE_DIRECTORY, createSuffixFilterFileCollector('.abcdefgh'))
    equal(jsFileList.length >= 2, true)
    equal(jsFileList.includes(SOURCE_FILE), true)
    equal(abcdefghFileList.length, 0)
  })

  it('getFileList(createPrefixMapperFileCollector) File', async () => {
    const fileList = await getFileList(SOURCE_FILE, createPrefixMapperFileCollector('PREFIX-'))
    equal(fileList.length, 1)
    equal(fileList[ 0 ][ 0 ], SOURCE_FILE)
    equal(fileList[ 0 ][ 1 ].includes('PREFIX-'), true)
  })

  it('getFileList(createPrefixMapperFileCollector) Directory', async () => {
    const fileList = await getFileList(SOURCE_DIRECTORY, createPrefixMapperFileCollector('PREFIX-'))
    equal(fileList.length >= 2, true)
    equal(fileList.map((v) => v[ 0 ]).includes(SOURCE_FILE), true)
    equal(fileList.every((v) => v[ 1 ].includes('PREFIX-')), true)
  })

  it('createGetPathFromRoot()', () => {
    const checkPath = (getPathFromRoot, rootPath) => {
      const expectedPath = `${rootPath}/a/b/c`.replace(/\//g, sepPath)
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
