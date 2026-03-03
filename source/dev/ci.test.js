import { getKit } from 'source/node/kit.js'
import { runInfoPatchCombo } from './ci.js'

const { describe, it, info = console.log } = globalThis

describe('CI', () => {
  it('runInfoPatchCombo()', async () => {
    runInfoPatchCombo(getKit({
      title: 'test-ci', isQuiet: false, padWidth: 32, logFunc: info,
      isDryrun: true
    }))
  })
})
