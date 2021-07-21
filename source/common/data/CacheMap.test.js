import { strictEqual, stringifyEqual } from 'source/common/verify.js'
import { createCacheMap } from './CacheMap.js'

const { describe, it } = globalThis

const getTestData = (valueSizeSumMax) => {
  const cacheMap = createCacheMap({ valueSizeSumMax })
  const dataList = [ 0, 1, 2, 3, 4 ].map((index) => ({ key: `Key${index}`, value: `Data${index}` }))
  return { cacheMap, dataList }
}

const doSanityTest = (cacheMap, length) => {
  it('should has matched cacheMap.getSize', () => strictEqual(cacheMap.getSize(), length))
}

describe('Common.Data.CacheMap', () => {
  describe('CacheMap', () => {
    doSanityTest(createCacheMap({ valueSizeSumMax: 1 }), 0)
    doSanityTest(createCacheMap({ valueSizeSumMax: 512 }), 0)
    doSanityTest(createCacheMap({ valueSizeSumMax: 512 * 512 }), 0)
    doSanityTest(createCacheMap({ valueSizeSumMax: 512, valueSizeSingleMax: 1 }), 0)
    doSanityTest(createCacheMap({ valueSizeSumMax: 512, valueSizeSingleMax: 1, eventHub: null }), 0)
  })

  describe('CacheMap.set', () => {
    const { cacheMap, dataList } = getTestData()
    dataList.forEach(({ key, value }) => cacheMap.set(key, value))
    doSanityTest(cacheMap, 5)
  })

  describe('CacheMap.set size busted', () => {
    const { cacheMap, dataList } = getTestData(3)
    dataList.forEach(({ key, value }) => cacheMap.set(key, value))
    cacheMap.set(dataList[ 0 ].key, dataList[ 0 ].value)
    cacheMap.set(dataList[ 0 ].key, dataList[ 0 ].value)
    cacheMap.set(dataList[ 1 ].key, dataList[ 1 ].value)
    cacheMap.set(dataList[ 1 ].key, dataList[ 1 ].value)
    cacheMap.set(dataList[ 2 ].key, dataList[ 2 ].value)
    cacheMap.set(dataList[ 2 ].key, dataList[ 2 ].value)
    dataList.forEach(({ key, value }, index) => it('should has match cacheValue', () => strictEqual(cacheMap.get(key), index <= 2 ? value : undefined)))
    doSanityTest(cacheMap, 3) // 2 of 5 busted
  })

  describe('CacheMap.get', () => {
    const { cacheMap, dataList } = getTestData()
    dataList.forEach(({ key, value }) => cacheMap.set(key, value))
    dataList.forEach(({ key, value }) => it('should has matched cacheValue', () => strictEqual(cacheMap.get(key), value)))
    doSanityTest(cacheMap, 5)
  })

  describe('CacheMap.get expired', () => {
    const { cacheMap, dataList } = getTestData()
    dataList.forEach(({ key, value }, index) => cacheMap.set(key, value, 1, index <= 2 ? -1 : undefined))
    dataList.forEach(({ key, value }, index) => it('should has match cacheValue', () => strictEqual(cacheMap.get(key), index <= 2 ? undefined : value)))
    doSanityTest(cacheMap, 2) // 3 of 5 expired
  })

  describe('CacheMap.clear', () => {
    const { cacheMap, dataList } = getTestData()
    dataList.forEach(({ key, value }) => cacheMap.set(key, value))
    cacheMap.clear()
    doSanityTest(cacheMap, 0)
  })

  describe('CacheMap.pack & load', () => {
    const { cacheMap, dataList } = getTestData(3)
    dataList.forEach(({ key, value }) => cacheMap.set(key, value))

    const packDataList = cacheMap.saveCacheList()
    // console.log('packDataList', packDataList)

    const reloadPackDataList = JSON.parse(JSON.stringify(packDataList))
    stringifyEqual(reloadPackDataList, packDataList)

    cacheMap.loadCacheList(reloadPackDataList) // should skip all, since cache data is same
    doSanityTest(cacheMap, 3)

    const loadCacheMap = createCacheMap({ valueSizeSumMax: 3 })
    loadCacheMap.loadCacheList(reloadPackDataList) // should apply all, since the map is empty
    doSanityTest(loadCacheMap, 3)

    const repackDataList = loadCacheMap.saveCacheList()
    // console.log('repackDataList', repackDataList)
    stringifyEqual(repackDataList, packDataList)
  })
})
