import { truthy } from 'source/common/verify.js'
import {
  check, verify,
  getGitBranch, getGitCommitHash, getGitCommitMessage
} from './git.js'

const { describe, it, info = console.log } = globalThis
const log = __DEV__ ? info : () => {}

describe('Node.Module.Software.git', () => {
  it('check()', () => truthy(check()))
  it('verify()', verify)

  it('getGitBranch()', () => log(`getGitBranch: ${getGitBranch()}`))
  it('getGitCommitHash()', () => log(`getGitCommitHash: ${getGitCommitHash()}`))
  it('getGitCommitMessage()', () => log(`getGitCommitMessage: ${getGitCommitMessage()}`))
})
