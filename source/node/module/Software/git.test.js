import { truthy } from 'source/common/verify.js'
import {
  check, verify,
  getGitBranch, getGitCommitHash, getGitCommitMessage
} from './git.js'

const { describe, it, info = console.log } = globalThis

describe('Node.Module.Software.git', () => {
  it('check()', () => truthy(check()))
  it('verify()', verify)

  it('getGitBranch()', () => info(`getGitBranch: ${getGitBranch()}`))
  it('getGitCommitHash()', () => info(`getGitCommitHash: ${getGitCommitHash()}`))
  it('getGitCommitMessage()', () => info(`getGitCommitMessage: ${getGitCommitMessage()}`))
})
