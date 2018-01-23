// TODO: consider using route?
const concatKeyFrag = (fragList) => `@@|${fragList.join('|')}`
const reduceKeySelector = (selectorList) => selectorList.reduce((preList, selector) => {
  const fragList = Array.isArray(selector) ? selector : [ selector ]
  const concatList = []
  preList.forEach((pre) => fragList.forEach((frag) => concatList.push(`${pre}|${frag}`)))
  return concatList
}, [ '@@' ])

export { concatKeyFrag, reduceKeySelector }
