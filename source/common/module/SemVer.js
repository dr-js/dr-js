import { compareStringWithNumber } from 'source/common/compare'

const REGEXP_SEMVER = /^(\d+)\.(\d+)\.(\d+)(.*)$/ // simple match

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
  : isShorterWithoutNumber(a, b) ? 1
    : isShorterWithoutNumber(b, a) ? -1
      : compareStringWithNumber(a, b)

const REGEXP_DOUBLE_NUMBER = /\d\d/

const isShorterWithoutNumber = (shorter, longer) => (
  longer.startsWith(shorter) &&
  !REGEXP_DOUBLE_NUMBER.test(longer.slice(shorter.length - 1, shorter.length + 1))
)

export { parseSemVer, compareSemVer }
