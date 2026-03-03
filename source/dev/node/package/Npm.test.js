import { findUpPackageRoot } from 'source/node/module/Software/npm.js'
import {
  outdatedJSON, outdatedWithTempJSON
} from './Npm.js'

const { describe, it, info = console.log } = globalThis

describe('Node.Package.Npm', () => {
  it('outdatedJSON()', async () => {
    const packageRoot = findUpPackageRoot(process.cwd())
    info(`packageRoot: ${packageRoot}`)
    info(JSON.stringify(await outdatedJSON({ packageRoot })))
    info(JSON.stringify(await outdatedJSON({ packageRoot, isBuggyTag: true })))
  })

  it('outdatedWithTempJSON()', async () => {
    const packageJSON = {
      dependencies: { '@dr-js/core': '*' },
      devDependencies: { '@dr-js/dev': '*' },
      peerDependencies: { 'from-peer': 'npm:@dr-js/core@*' },
      optionalDependencies: { 'from-optional': 'npm:@dr-js/dev@*' }
    }
    info(JSON.stringify(await outdatedWithTempJSON({ packageJSON })))
    info(JSON.stringify(await outdatedWithTempJSON({ packageJSON, isBuggyTag: true })))
  })
})
