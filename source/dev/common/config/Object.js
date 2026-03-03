import { typeNameOf } from 'source/common/format.js'
import { isBasicObject, isString } from 'source/common/check.js'
import { dupJSON } from 'source/common/data/function.js'
import { createTreeDepthFirstSearch } from 'source/common/data/Tree.js'
import { objectMergeDeep } from 'source/common/mutable/Object.js'

const FLAVOR_SEPARATOR = '|'

const pickFlavor = (
  object = {},
  flavorConfig = {},
  flavorKey = '',
  flavorSet = new Set() // to collect flavorKey in flavorConfig, for later check
) => {
  const objectList = [ dupJSON(object) ]
  for (const [ keyOrCombo, flavorValue ] of Object.entries(flavorConfig)) {
    const keyList = keyOrCombo.split(FLAVOR_SEPARATOR)
    keyList.forEach((key) => flavorSet.add(key))
    if (!keyList.includes(flavorKey)) continue
    if (!isBasicObject(flavorValue)) throw new Error(`invalid flavorValue of ${keyOrCombo}`)
    objectList.push(flavorValue)
  }
  return objectList
}

const mergeFlavor = (objectList) => objectList.reduce((o, object) => objectMergeDeep(o, object), {})

const useFlavor = (
  object = {},
  flavorConfig = {},
  flavorKey = '',
  flavorSet = new Set() // to collect flavorKey in flavorConfig, for later check
) => mergeFlavor(pickFlavor(
  object,
  flavorConfig,
  flavorKey,
  flavorSet
))

const SECRET_PREFIX = '@@.'

const useSecret = (
  object = {},
  secretConfig = {},
  onSecret = (secretPath, valueType) => {} // for log
) => {
  object = dupJSON(object)
  objectDFS(
    [ null, '', object ],
    ([ upValue, key, value ]) => {
      if (!isString(value) || !value.startsWith(SECRET_PREFIX)) return
      const secretValue = getPathValue(secretConfig, value.split('.').slice(1))
      if (secretValue === undefined) throw new Error(`expect secret: ${value}`) // NOTE: can't use undefined as secret value
      onSecret(value, typeNameOf(secretValue))
      upValue[ key ] = secretValue
    }
  )
  return object
}
const objectDFS = createTreeDepthFirstSearch(([ upValue, key, value ]) => {
  if (!isBasicObject(value)) return
  return Object.entries(value).map(([ subKey, subValue ]) => [ value, subKey, subValue ])
})
const getPathValue = (object, keyPath) => {
  let index = 0
  while (isBasicObject(object) && keyPath[ index ]) {
    object = object[ keyPath[ index ] ]
    index++
  }
  return object
}

export {
  FLAVOR_SEPARATOR, pickFlavor, mergeFlavor, useFlavor,
  SECRET_PREFIX, useSecret
}
