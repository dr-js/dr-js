import { resolve } from 'path'
import { strictEqual, stringifyEqual } from 'source/common/verify.js'
import { getFileList } from 'source/node/fs/Directory.js'
import { modifyDelete } from 'source/node/fs/Modify.js'

import {
  createFactDatabaseExot,
  tryDeleteExtraCache
} from './FactDatabase.js'

const { describe, it, after } = global

const TEST_ROOT = resolve(__dirname, './test-fact-database-gitignore/')

const TEST_TEXT = String(new Date())

const basicTest = async (pathFactDirectory) => {
  const factDB = createFactDatabaseExot({ pathFactDirectory })
  await factDB.up(console.error)

  stringifyEqual(factDB.getState(), { id: 0 })

  factDB.add({ key1: 1 })
  factDB.add({ key2: 2 })
  factDB.add({ key3: 3 })
  stringifyEqual(factDB.getState(), { id: 3, key1: 1, key2: 2, key3: 3 })

  factDB.split() // to factLog.4.log
  await factDB.getSaveFactCachePromise() // wait for file to write

  factDB.add({ key1: 2 })
  factDB.add({ key2: 4 })
  factDB.add({ key3: 6 })
  stringifyEqual(factDB.getState(), { id: 6, key1: 2, key2: 4, key3: 6 })

  factDB.split() // to factLog.7.log
  factDB.split() // should only split once
  await factDB.getSaveFactCachePromise() // wait for file to write

  factDB.add({ textKey: TEST_TEXT })
  stringifyEqual(factDB.getState(), { id: 7, key1: 2, key2: 4, key3: 6, textKey: TEST_TEXT })

  factDB.add({ [ TEST_TEXT ]: 'testValue' })
  stringifyEqual(factDB.getState(), { id: 8, key1: 2, key2: 4, key3: 6, textKey: TEST_TEXT, [ TEST_TEXT ]: 'testValue' })

  factDB.save()

  factDB.add({}) // empty fact
  stringifyEqual(factDB.getState(), { id: 9, key1: 2, key2: 4, key3: 6, textKey: TEST_TEXT, [ TEST_TEXT ]: 'testValue' })

  factDB.save()
  factDB.save()

  factDB.add({ key1: 1, key2: 2, key3: 3 })
  stringifyEqual(factDB.getState(), { id: 10, key1: 1, key2: 2, key3: 3, textKey: TEST_TEXT, [ TEST_TEXT ]: 'testValue' })

  await factDB.down() // wait for file to write

  const fileList = await getFileList(pathFactDirectory)
  // console.log(fileList)
  strictEqual(fileList.length, 4)

  return factDB.getState()
}

after(() => modifyDelete(TEST_ROOT))

describe('Node.Module.FactDatabase', () => {
  it('createFactDatabaseExot()', async () => {
    const pathFactDirectory = resolve(TEST_ROOT, 'test-1')

    const resultState = await basicTest(pathFactDirectory)

    const factDBVerify = createFactDatabaseExot({ pathFactDirectory })
    await factDBVerify.up(console.error)
    stringifyEqual(factDBVerify.getState(), resultState)
    factDBVerify.down()
  })

  it('tryDeleteExtraCache()', async () => {
    const pathFactDirectory = resolve(TEST_ROOT, 'test-2')

    await basicTest(pathFactDirectory)

    const factDB = createFactDatabaseExot({ pathFactDirectory })
    await factDB.up(console.error)

    factDB.add({})
    factDB.save()

    factDB.add({})
    factDB.save()

    factDB.add({})
    factDB.save()

    await factDB.down() // wait for file to write

    const fileList = await getFileList(pathFactDirectory)
    // console.log(fileList)
    strictEqual(fileList.length, 5)

    await tryDeleteExtraCache({ pathFactDirectory })

    const reducedFileList = await getFileList(pathFactDirectory)
    // console.log(reducedFileList)
    strictEqual(reducedFileList.length, 5)
  })
})
