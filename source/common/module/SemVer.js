import { compareStringWithNumber } from 'source/common/compare'

const REGEXP_SEMVER = /^(\d+)\.(\d+)\.(\d+)(.*)$/ // simple match

const parseSemVer = (versionString) => {
  let [ , major, minor, patch, label = '' ] = REGEXP_SEMVER.exec(versionString)
  major = parseInt(major)
  minor = parseInt(minor)
  patch = parseInt(patch)
  if (isNaN(major) || isNaN(minor) || isNaN(patch)) throw new Error(`[parseSemVer] invalid versionString: ${versionString}`)
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
  : a === '' ? 1
    : b === '' ? -1
      : compareStringWithNumber(a, b) // TODO: may be too simple

export { parseSemVer, compareSemVer }
