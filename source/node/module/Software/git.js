import { run, runSync } from 'source/node/run.js'
import { spawnString, probeSync, createArgListPack } from '../function.js'

// $ git --version
//   git version 2.23.0
const { getArgs, setArgs, check, verify } = createArgListPack(
  () => probeSync([ 'git', '--version' ], 'git version')
    ? [ 'git' ]
    : undefined,
  'expect "git" in PATH'
)
const runGit = (argList = [], option) => run([ ...verify(), ...argList ], option)
const runGitSync = (argList = [], option) => runSync([ ...verify(), ...argList ], option)

const gitString = (...args) => spawnString([ ...verify(), ...args ])
const squeeze = (string) => string.replace(/\s/g, '')

const getGitBranch = () => squeeze( // TODO: DEPRECATE: move to `@dr-js/dev`
  gitString('symbolic-ref', '--short', 'HEAD') ||
  `detached-HEAD/${gitString('rev-parse', '--short', 'HEAD')}` // NOTE: fallback if no branch, mostly in CI tag build
)
const getGitCommitHash = (revisionRange = 'HEAD') => squeeze(gitString('log', '-1', '--format=%H', revisionRange)) // TODO: DEPRECATE: move to `@dr-js/dev`
const getGitCommitMessage = (revisionRange = 'HEAD') => gitString('log', '-1', '--format=%B', revisionRange) // TODO: DEPRECATE: move to `@dr-js/dev`

export {
  getArgs, setArgs, check, verify,
  runGit, runGitSync,

  getGitBranch, getGitCommitHash, getGitCommitMessage // TODO: DEPRECATE: move to `@dr-js/dev` // TODO: NOTE: sync only, expect cwd under git repo
}
