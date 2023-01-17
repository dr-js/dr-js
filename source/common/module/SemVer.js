import { compareString } from 'source/common/compare.js'

const REGEXP_SEMVER = /^(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z-.]+)?$/ // simple match, allow label (-abc) but not metadata (+abc) // https://semver.org/

// TODO: NOTE: parsed `label` will have leading `-`, like label will be `-dev.0` for `0.0.0-dev.0`

const parseSemVer = (versionString) => {
  let [ , major, minor, patch, label = '' ] = REGEXP_SEMVER.exec(versionString) || []
  major = parseInt(major)
  minor = parseInt(minor)
  patch = parseInt(patch)
  if (isNaN(major) || isNaN(minor) || isNaN(patch)) throw new Error(`invalid version: ${versionString}`)
  return { major, minor, patch, label }
}

const packSemVer = ({ major, minor, patch, label = '' }) => `${major}.${minor}.${patch}${label}` // no check for now

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

// bump version by current git branch name
//   main/master:
//     1.0.0 -> 1.0.1
//     1.0.0-with-label -> 1.0.0
//   other-dev-branch:
//     1.0.0 -> 1.0.1-otherdevbranch.0
//     1.0.0-with-label -> 1.0.0-otherdevbranch.0
//     1.0.0-otherdevbranch.0 -> 1.0.0-otherdevbranch.1
const versionBumpByGitBranch = (version, {
  gitBranch, // = getGitBranch(),
  getIsMajorBranch = (gitBranch) => [ 'master', 'main', 'major' ].includes(gitBranch),
  isMajorBranch = getIsMajorBranch(gitBranch)
}) => {
  const { major, minor, patch, label } = parseSemVer(version)
  if (isMajorBranch) { // X.Y.Z for non-dev branch
    const bumpPatch = label
      ? patch // just drop label
      : parseInt(patch) + 1 // bump patch
    return `${major}.${minor}.${bumpPatch}`
  } else { // X.Y.Z-labelGitBranch.A for dev branch
    const labelGitBranch = gitBranch.replace(/[\W_]/g, '')
    return versionBumpToIdentifier(version, { identifier: labelGitBranch })
  }
}

// bump version to have label identifier
//   1.0.0 -> 1.0.1-TEST.0
//   1.0.0-dev.0 -> 1.0.0-TEST.0
//   1.0.0-TEST.0 -> 1.0.0-TEST.1
//   1.0.0-TEST.0.local.0 -> 1.0.0-TEST.1
//   1.0.0-TEST.0ABC -> 1.0.1-TEST.0
const versionBumpToIdentifier = (version, {
  identifier = 'TEST'
}) => {
  let { major, minor, patch, label } = parseSemVer(version)
  if (label.startsWith(`-${identifier}.`)) {
    const extraString = label.slice(`-${identifier}.`.length)
    if (/^\d+$/.test(extraString)) return versionBumpLastNumber(version)
    const extraStringFirstIdentifier = extraString.split('.')[ 0 ]
    if (/^\d+$/.test(extraStringFirstIdentifier)) return `${major}.${minor}.${patch}-${identifier}.${parseInt(extraStringFirstIdentifier) + 1}` // drop extra identifier
    label = '' // bump patch
  }
  return `${major}.${minor}.${label ? patch : patch + 1}-${identifier}.0`
}

// bump visible last number, including number in label
//   1.0.0 -> 1.0.1
//   1.0.0-dev.0 -> 1.0.0-dev.1
//   1.0.0-dev19abc -> 1.0.0-dev20abc
const versionBumpLastNumber = (version) => {
  parseSemVer(version) // verify
  if (!REGEXP_LAST_NUMBER.test(version)) throw new Error(`[versionBumpLastNumber] no number to bump in version: ${version}`)
  return version.replace(REGEXP_LAST_NUMBER, (match, $1, $2) => `${parseInt($1) + 1}${$2}`)
}
const REGEXP_LAST_NUMBER = /(\d+)(\D*)$/

// bump version so local package do not mask later release (the local version should be smaller than next release version)
//   1.0.0 -> 1.0.0-local.0
//   1.0.0-local.0 -> 1.0.0-local.1
//   1.0.0-with-label -> 1.0.0-with-label.local.0
//   1.0.0-with-label.local.0 -> 1.0.0-with-label.local.1
const versionBumpToLocal = (version) => {
  const { major, minor, patch, label } = parseSemVer(version)
  if (!label) return `${major}.${minor}.${patch}-local.0` // non-dev version, append with "-"
  else if (!REGEXP_LABEL_LOCAL.test(label)) return `${major}.${minor}.${patch}${label}.local.0` // non-local dev version, append with "."
  else return versionBumpLastNumber(version) // local dev version, bump
}
const REGEXP_LABEL_LOCAL = /^-(?:.*\.)?local\.\d+$/

const isVersionSpecComplex = (versionSpec) => ( // https://docs.npmjs.com/cli/v7/configuring-npm/package-json#dependencies
  versionSpec.includes(' ') || // multiple version: `>a <b`, `a || b`
  versionSpec.includes(':') || // protocol: `file:`, `npm:`, `https:`
  versionSpec.includes('/') // url or local path
)

export {
  parseSemVer, packSemVer, compareSemVer,

  versionBumpByGitBranch,
  versionBumpToIdentifier,
  versionBumpLastNumber,
  versionBumpToLocal,
  isVersionSpecComplex
}
