import { strictEqual /* , stringifyEqual */ } from 'source/common/verify.js'
// import { dupJSON } from './function.js'
import { createCacheMap2 } from './CacheMap2.js'

const { describe, it } = globalThis

const getTestData = (sizeMax = 999) => {
  const cacheMap = createCacheMap2({ sizeMax })
  const dataList = [ 0, 1, 2, 3, 4 ].map((index) => ({ key: `Key${index}`, value: `Data${index}` }))
  return { cacheMap, dataList }
}

const doSanityTest = (cacheMap, length) => {
  it('should has matched "cacheMap.getSize"', () => strictEqual(cacheMap.getSize(), length))
}

describe('Common.Data.CacheMap2', () => {
  describe('CacheMap2', () => {
    doSanityTest(createCacheMap2({ sizeMax: 1 }), 0)
    doSanityTest(createCacheMap2({ sizeMax: 512 }), 0)
    doSanityTest(createCacheMap2({ sizeMax: 512 * 512 }), 0)
    doSanityTest(createCacheMap2({ sizeMax: 512, map: new Map() }), 0)
    doSanityTest(createCacheMap2({ sizeMax: 512, expireAfter: 500 }), 0)
  })

  describe('CacheMap2.set', () => {
    const { cacheMap, dataList } = getTestData()
    dataList.forEach(({ key, value }) => cacheMap.set(key, value))
    doSanityTest(cacheMap, 5)
  })

  describe('CacheMap2.set size busted', () => {
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

  describe('CacheMap2.get', () => {
    const { cacheMap, dataList } = getTestData()
    dataList.forEach(({ key, value }) => cacheMap.set(key, value))
    dataList.forEach(({ key, value }) => it('should has matched cacheValue', () => strictEqual(cacheMap.get(key), value)))
    doSanityTest(cacheMap, 5)
  })

  describe('CacheMap2.get expired', () => {
    const { cacheMap, dataList } = getTestData()
    dataList.forEach(({ key, value }, index) => cacheMap.set(key, value, index <= 2 ? -1 : undefined))
    dataList.forEach(({ key, value }, index) => it('should has match cacheValue', () => strictEqual(cacheMap.get(key), index <= 2 ? undefined : value)))
    doSanityTest(cacheMap, 2) // 3 of 5 expired
  })

  describe('CacheMap2.clear', () => {
    const { cacheMap, dataList } = getTestData()
    dataList.forEach(({ key, value }) => cacheMap.set(key, value))
    cacheMap.clear()
    doSanityTest(cacheMap, 0)
  })

  // describe('CacheMap2.pack & load', () => {
  //   const { cacheMap, dataList } = getTestData(3)
  //   dataList.forEach(({ key, value }) => cacheMap.set(key, value))
  //
  //   const packDataList = cacheMap.saveCacheList()
  //   // console.log('packDataList', packDataList)
  //
  //   const reloadPackDataList = dupJSON(packDataList)
  //   stringifyEqual(reloadPackDataList, packDataList)
  //
  //   cacheMap.loadCacheList(reloadPackDataList) // should skip all, since cache data is same
  //   doSanityTest(cacheMap, 3)
  //
  //   const loadCacheMap2 = createCacheMap2({ valueSizeSumMax: 3 })
  //   loadCacheMap2.loadCacheList(reloadPackDataList) // should apply all, since the map is empty
  //   doSanityTest(loadCacheMap2, 3)
  //
  //   const repackDataList = loadCacheMap2.saveCacheList()
  //   // console.log('repackDataList', repackDataList)
  //   stringifyEqual(repackDataList, packDataList)
  // })
})
