import { strictEqual, doThrow } from 'source/common/verify.js'
import { resolveCommandName } from 'source/node/system/ResolveCommand.js'

import {
  check, verify,
  checkCompose, verifyCompose
} from './docker.js'

const { describe, it, info = console.log } = globalThis

describe('Node.Module.Software.Docker', () => {
  __DEV__ && info(`DOCKER_BIN_PATH: ${resolveCommandName('docker')}`)

  if (resolveCommandName('docker')) {
    it('check()', () => strictEqual(check(), true))
    it('verify()', verify)
    it('checkCompose()', () => strictEqual(checkCompose(), true)) // NOTE: often should have both
    it('verifyCompose()', verifyCompose) // NOTE: often should have both
  } else { // no docker installed (GitHub CI Macos)
    it('check()', () => strictEqual(check(), false))
    it('verify()', () => doThrow(verify))
    it('checkCompose()', () => strictEqual(checkCompose(), false))
    it('verifyCompose()', () => doThrow(verifyCompose))
  }
})
