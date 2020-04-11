const concatKeyFrag = (...fragList) => `@/${fragList.join('/')}`

const reduceKeySelector = (...selectorList) => selectorList.reduce((preList, selector) => {
  const fragList = Array.isArray(selector) ? selector : [ selector ]
  const concatList = []
  preList.forEach((pre) => fragList.forEach((frag) => concatList.push(`${pre}/${frag}`)))
  return concatList
}, [ '@' ])

const createMultiKeySwitch = ({ keyCount }) => {
  const switchMap = { /* switchKey: value */ }

  const set = (value, keySelectorListList) => keySelectorListList.forEach((keySelectorList) => {
    if (keyCount !== keySelectorList.length) throw new Error(`invalid keySelectorList length: ${keySelectorList.length}, expect: ${keyCount}`)
    reduceKeySelector(...keySelectorList).forEach((switchKey) => {
      if (switchMap[ switchKey ]) throw new Error(`duplicate switchKey: ${switchKey}`)
      switchMap[ switchKey ] = value
    })
  })

  const get = (...keyFragList) => {
    if (keyCount !== keyFragList.length) throw new Error(`invalid keyCount: ${keyFragList.length}, expect: ${keyCount}`)
    return switchMap[ concatKeyFrag(...keyFragList) ]
  }

  const verifyFull = (...keySelectorList) => {
    if (keyCount !== keySelectorList.length) throw new Error(`invalid keyCount: ${keySelectorList.length}, expect: ${keyCount}`)
    const fullKeyList = reduceKeySelector(...keySelectorList)
    const setKeyList = Object.keys(switchMap)
    if (fullKeyList.length !== setKeyList.length) {
      const unsetKeyList = fullKeyList.filter((key) => !setKeyList.includes(key))
      console.warn('[verifyFull] check', { fullKeyList, setKeyList })
      console.warn('[verifyFull] unsetKeyList', unsetKeyList)
      throw new Error('[verifyFull] not all possible key is set')
    }
  }

  return { set, get, verifyFull }
}

export {
  concatKeyFrag,
  reduceKeySelector,
  createMultiKeySwitch
}
