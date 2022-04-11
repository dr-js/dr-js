import { doThrow, truthy } from 'source/common/verify.js'
import { resolveCommandName } from 'source/node/system/ResolveCommand.js'

import {
  check, verify,
  runDocker, runDockerSync,
  runDockerStdout, runDockerStdoutSync,

  // checkLocalImage, pullImage, checkPullImage,
  getContainerLsList, // patchContainerLsListStartedAt, matchContainerLsList,

  checkCompose, verifyCompose,
  runCompose, runComposeSync,
  runComposeStdout, runComposeStdoutSync
} from './docker.js'

const { describe, it, info = console.log } = globalThis
const log = __DEV__ ? info : () => {}

describe('Node.Module.Software.Docker', () => {
  log(`DOCKER_BIN_PATH: ${resolveCommandName('docker')}`)

  if (resolveCommandName('docker')) {
    it('check()', () => truthy(check()))
    it('verify()', verify)
    it('checkCompose()', () => truthy(checkCompose())) // NOTE: often should have both
    it('verifyCompose()', verifyCompose) // NOTE: often should have both

    it('runDocker()', async () => {
      const { promise, stdoutPromise } = runDocker([ 'version' ], { quiet: true })
      await promise
      log(String(await stdoutPromise))
      log(String(await runDockerStdout([ 'version' ])))
    })

    it('runDockerSync()', () => {
      const { stdout } = runDockerSync([ 'version' ], { quiet: true })
      log(String(stdout))
      log(String(runDockerStdoutSync([ 'version' ])))
    })

    it('runCompose()', async () => {
      const { promise, stdoutPromise } = runCompose([ 'version' ], { quiet: true })
      await promise
      log(String(await stdoutPromise))
      log(String(await runComposeStdout([ 'version' ])))
    })

    it('runComposeSync()', () => {
      const { stdout } = runComposeSync([ 'version' ], { quiet: true })
      log(String(stdout))
      log(String(runComposeStdoutSync([ 'version' ])))
    })

    it('getContainerLsList()', async () => {
      log(JSON.stringify(await getContainerLsList(), null, 2))
    })
  } else { // no docker installed (GitHub CI Macos)
    log('no docker installed')
    it('check()', () => truthy(!check()))
    it('verify()', () => doThrow(verify))
    it('checkCompose()', () => truthy(!checkCompose()))
    it('verifyCompose()', () => doThrow(verifyCompose))
  }
})
