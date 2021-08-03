import { strictEqual, doThrow } from 'source/common/verify.js'
import { resolveCommandName } from 'source/node/system/ResolveCommand.js'

import {
  check, verify,
  runDocker, runDockerStdout, runDockerSync, runDockerStdoutSync,

  checkCompose, verifyCompose,
  runCompose, runComposeStdout, runComposeSync, runComposeStdoutSync
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
      info(String(await runDockerStdout([ 'version' ])))
    })

    it('runDockerSync()', () => {
      const { stdout } = runDockerSync([ 'version' ], { quiet: true })
      info(String(stdout))
      info(String(runDockerStdoutSync([ 'version' ])))
    })

    it('runCompose()', async () => {
      const { promise, stdoutPromise } = runCompose([ 'version' ], { quiet: true })
      await promise
      info(String(await stdoutPromise))
      info(String(await runComposeStdout([ 'version' ])))
    })

    it('runComposeSync()', () => {
      const { stdout } = runComposeSync([ 'version' ], { quiet: true })
      info(String(stdout))
      info(String(runComposeStdoutSync([ 'version' ])))
    })
  } else { // no docker installed (GitHub CI Macos)
    info('no docker installed')
    it('check()', () => strictEqual(check(), false))
    it('verify()', () => doThrow(verify))
    it('checkCompose()', () => strictEqual(checkCompose(), false))
    it('verifyCompose()', () => doThrow(verifyCompose))
  }
})
