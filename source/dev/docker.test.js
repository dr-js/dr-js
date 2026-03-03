import { prettyStringifyConfigObject } from 'source/common/format.js'
import { resolveCommandName } from 'source/node/system/ResolveCommand.js'
import {
  getContainerLsList
} from './docker.js'

const { describe, it, info = console.log } = globalThis

describe('Docker', () => {
  __DEV__ && info(`DOCKER_BIN_PATH: ${resolveCommandName('docker')}`)

  if (resolveCommandName('docker')) {
    it('getContainerLsList()', async () => {
      info(prettyStringifyConfigObject(await getContainerLsList()))
    })
  } else { // no docker installed (GitHub CI Macos)
    info('no docker installed')
  }
})
