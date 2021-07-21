import { strictEqual, doThrow } from 'source/common/verify.js'
import { resolveCommandName } from 'source/node/system/ResolveCommand.js'

import {
  check, verify,
  runDocker, runDockerSync,

  checkCompose, verifyCompose,
  runCompose, runComposeSync
} from './docker.js'

const { describe, it, info = console.log } = globalThis

describe('Node.Module.Software.Docker', () => {
  __DEV__ && info(`DOCKER_BIN_PATH: ${resolveCommandName('docker')}`)

  if (resolveCommandName('docker')) {
    it('check()', () => strictEqual(check(), true))
    it('verify()', verify)
    it('checkCompose()', () => strictEqual(checkCompose(), true)) // NOTE: often should have both
    it('verifyCompose()', verifyCompose) // NOTE: often should have both

    it('runDocker()', async () => {
      const { promise, stdoutPromise } = runDocker([ 'version' ], { quiet: true })
      await promise
      info(String(await stdoutPromise))
    })

    it('runDockerSync()', async () => {
      const { stdout } = runDockerSync([ 'version' ], { quiet: true })
      info(String(stdout))
    })

    it('runCompose()', async () => {
      const { promise, stdoutPromise } = runCompose([ 'version' ], { quiet: true })
      await promise
      info(String(await stdoutPromise))
    })

    it('runComposeSync()', async () => {
      const { stdout } = runComposeSync([ 'version' ], { quiet: true })
      info(String(stdout))
    })
  } else { // no docker installed (GitHub CI Macos)
    info('no docker installed')
    it('check()', () => strictEqual(check(), false))
    it('verify()', () => doThrow(verify))
    it('checkCompose()', () => strictEqual(checkCompose(), false))
    it('verifyCompose()', () => doThrow(verifyCompose))
  }
})
