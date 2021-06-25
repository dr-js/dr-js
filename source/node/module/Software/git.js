import { spawnString, probeSync, createArgListPack } from '../function.js'

// $ git --version
//   git version 2.23.0
const { getArgs, setArgs, check, verify } = createArgListPack(
  () => probeSync([ 'git', '--version' ], 'git version')
    ? [ 'git' ]
    : undefined,
  'expect "git" in PATH'
)

const gitString = (...args) => spawnString([ ...verify(), ...args ])
const squeeze = (string) => string.replace(/\s/g, '')

const getGitBranch = () => squeeze(
  gitString('symbolic-ref', '--short', 'HEAD') ||
  `detached-HEAD/${gitString('rev-parse', '--short', 'HEAD')}` // NOTE: fallback if no branch, mostly in CI tag build
)
const getGitCommitHash = (revisionRange = 'HEAD') => squeeze(gitString('log', '-1', '--format=%H', revisionRange))
const getGitCommitMessage = (revisionRange = 'HEAD') => gitString('log', '-1', '--format=%B', revisionRange)

export {
  getArgs, setArgs, check, verify,
  getGitBranch, getGitCommitHash, getGitCommitMessage // TODO: NOTE: sync only, expect cwd under git repo
}
