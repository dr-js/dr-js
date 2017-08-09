const toArray = (value) => (value instanceof Array ? value : value ? [ value ] : [])

const composeSelectorList = (selectorList) => selectorList.reduce((preList, selector) => {
  const fragList = toArray(selector)
  if (!fragList.length) return preList
  const concatList = []
  preList.forEach((pre) => fragList.forEach((frag) => concatList.push(`${pre}|${frag}`)))
  return concatList
}, [ '@@' ])

const composeKey = (keyFragList) => `@@|${keyFragList.join('|')}`

class KeySwitch {
  constructor () { this.keyMap = {} } // {String} - {value}

  set (keyList, value) { keyList.forEach((key) => (this.keyMap[ key ] = value)) }

  get (key) { return this.keyMap[ key ] || null }

  check (keyList, value) { return keyList.length && keyList.every((key) => this.keyMap[ key ] === value) }

  SET (selectorList, value) { this.set(composeSelectorList(selectorList), value) }

  GET (...fragList) { return this.get(composeKey(fragList)) }
}

export {
  composeSelectorList,
  composeKey,
  KeySwitch
}
