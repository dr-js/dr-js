import { equal, deepEqual } from 'assert'
import { resolve } from 'path'
import { createFactDatabase, tryDeleteExtraCache } from './FactDatabase'
import { getFileList } from 'source/node/file/Directory'
import { modify } from 'source/node/file/Modify'

const { describe, it, after } = global

const TEST_ROOT = resolve(__dirname, './test-fact-database-gitignore/')

const TEST_TEXT = (new Date()).toString()

const basicTest = async (pathFactDirectory) => {
  const factDB = await createFactDatabase({ pathFactDirectory, onError: console.error })

  deepEqual(factDB.getState(), { id: 0 })

  factDB.add({ key1: 1 })
  factDB.add({ key2: 2 })
  factDB.add({ key3: 3 })
  deepEqual(factDB.getState(), { id: 3, key1: 1, key2: 2, key3: 3 })

  factDB.split() // to factLog.4.log
  await factDB.getSaveFactCachePromise() // wait for file to write

  factDB.add({ key1: 2 })
  factDB.add({ key2: 4 })
  factDB.add({ key3: 6 })
  deepEqual(factDB.getState(), { id: 6, key1: 2, key2: 4, key3: 6 })

  factDB.split() // to factLog.7.log
  factDB.split() // should only split once
  await factDB.getSaveFactCachePromise() // wait for file to write

  factDB.add({ textKey: TEST_TEXT })
  deepEqual(factDB.getState(), { id: 7, key1: 2, key2: 4, key3: 6, textKey: TEST_TEXT })

  factDB.add({ [ TEST_TEXT ]: 'testValue' })
  deepEqual(factDB.getState(), { id: 8, key1: 2, key2: 4, key3: 6, textKey: TEST_TEXT, [ TEST_TEXT ]: 'testValue' })

  factDB.save()

  factDB.add({}) // empty fact
  deepEqual(factDB.getState(), { id: 9, key1: 2, key2: 4, key3: 6, textKey: TEST_TEXT, [ TEST_TEXT ]: 'testValue' })

  factDB.save()
  factDB.save()

  factDB.add({ key1: 1, key2: 2, key3: 3 })
  deepEqual(factDB.getState(), { id: 10, key1: 1, key2: 2, key3: 3, textKey: TEST_TEXT, [ TEST_TEXT ]: 'testValue' })

  factDB.end()
  await factDB.getSaveFactCachePromise() // wait for file to write

  const fileList = await getFileList(pathFactDirectory)
  // console.log(fileList)
  equal(fileList.length, 4)

  return factDB.getState()
}

after('clear', () => modify.delete(TEST_ROOT))

describe('Node.Module.FactDatabase', () => {
  it('createFactDatabase()', async () => {
    const pathFactDirectory = resolve(TEST_ROOT, 'test-1')

    const resultState = await basicTest(pathFactDirectory)

    const factDBVerify = await createFactDatabase({ pathFactDirectory, onError: console.error })
    deepEqual(factDBVerify.getState(), resultState)
    factDBVerify.end()
  })

  it('tryDeleteExtraCache()', async () => {
    const pathFactDirectory = resolve(TEST_ROOT, 'test-2')

    await basicTest(pathFactDirectory)

    const factDB = await createFactDatabase({ pathFactDirectory, onError: console.error })

    factDB.add({})
    factDB.save()

    factDB.add({})
    factDB.save()

    factDB.add({})
    factDB.save()

    factDB.end()
    await factDB.getSaveFactCachePromise() // wait for file to write

    const fileList = await getFileList(pathFactDirectory)
    // console.log(fileList)
    equal(fileList.length, 5)

    await tryDeleteExtraCache({ pathFactDirectory })

    const reducedFileList = await getFileList(pathFactDirectory)
    // console.log(reducedFileList)
    equal(reducedFileList.length, 5)
  })
})
