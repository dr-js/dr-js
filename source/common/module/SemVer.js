import { compareString } from 'source/common/compare.js'

const REGEXP_SEMVER = /^(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z-.]+)?$/ // simple match, allow label (-abc) but not metadata (+abc) // https://semver.org/

const parseSemVer = (versionString) => {
  let [ , major, minor, patch, label = '' ] = REGEXP_SEMVER.exec(versionString) || []
  major = parseInt(major)
  minor = parseInt(minor)
  patch = parseInt(patch)
  if (isNaN(major) || isNaN(minor) || isNaN(patch)) throw new Error(`invalid version: ${versionString}`)
  return { major, minor, patch, label }
}

const compareSemVer = (stringA, stringB) => { // basically (a - b)
  const a = parseSemVer(stringA)
  const b = parseSemVer(stringB)
  return (
    (a.major - b.major) ||
    (a.minor - b.minor) ||
    (a.patch - b.patch) ||
    compareSemVerLabel(a.label, b.label)
  )
}

const compareSemVerLabel = (a, b) => (a === b) ? 0
  : a === '' ? 1 // empty label is bigger (non-dev version)
    : b === '' ? -1
      : compareSemVerLabelIdentifier(a, b)

const compareSemVerLabelIdentifier = (a, b) => { // assume `a !== b`
  const aList = a.split('.')
  const bList = b.split('.')
  let index = 0
  while (true) {
    const aI = aList[ index ]
    const bI = bList[ index ]
    if (aI === bI) { // next identifier
      index++
      continue
    }
    if (aI === undefined) return -1 // empty identifier is smaller
    if (bI === undefined) return 1
    const aAllNumber = REGEXP_ALL_NUMBER.test(aI)
    const bAllNumber = REGEXP_ALL_NUMBER.test(bI)
    if (aAllNumber && bAllNumber) return parseInt(aI) - parseInt(bI)
    if (!aAllNumber && bAllNumber) return 1
    if (aAllNumber && !bAllNumber) return -1
    if (!aAllNumber && !bAllNumber) return compareString(aI, bI)
  }
}
const REGEXP_ALL_NUMBER = /^\d+$/

export { parseSemVer, compareSemVer }
