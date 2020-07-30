const KEY_HASH_ID = {}

// TODO:
//   just an idea, may cause GC leak (currently will hold all value) or low performance (if lookup needed in a loop)
//   mapping multi-value key (tuple) to integer, and later only use the integer,
//   so normal `Map` and `switch` can support multi-value key

const createTupleHasher = (initialId = 0, hashMap = new Map()) => {
  let id = initialId

  const clear = () => { // remember to clear or all the value will be referenced in hashMap
    id = initialId
    hashMap.clear()
  }
  const hash = (...valueList) => hashList(valueList)
  const hashList = (valueList) => {
    const indexMax = valueList.length
    let index = 0
    let currentHashMap = hashMap
    while (index < indexMax) {
      const value = valueList[ index ]
      let nextHashMap = currentHashMap.get(value)
      if (nextHashMap === undefined) {
        nextHashMap = new Map()
        currentHashMap.set(value, nextHashMap)
      }
      index++
      currentHashMap = nextHashMap
    }
    let hashId = currentHashMap.get(KEY_HASH_ID)
    if (hashId === undefined) {
      hashId = id
      currentHashMap.set(KEY_HASH_ID, hashId)
      id++
    }
    return hashId
  }

  return { clear, hash, hashList }
}

export { createTupleHasher }
