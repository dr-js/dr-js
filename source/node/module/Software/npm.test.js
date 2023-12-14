import { resolve } from 'node:path'
import { strictEqual, doNotThrow, truthy } from 'source/common/verify.js'
import { compareSemVer } from 'source/common/module/SemVer.js'

import {
  findUpPackageRoot,
  getPathNpmExecutable, getSudoArgs,
  getPathNpmGlobalRoot, fromGlobalNodeModules,
  getPathNpm, fromNpmNodeModules,
  hasRepoVersion,
  fetchWithJumpProxy
} from './npm.js'

const { describe, it, info = console.log } = globalThis

describe('Node.Module.Software.npm', () => {
  it('findUpPackageRoot()', () => {
    strictEqual(
      findUpPackageRoot(__dirname),
      resolve(__dirname, '../../../../')
    )

    // console.log(require.resolve('@dr-js/core/module/common/verify'))
    strictEqual(
      findUpPackageRoot(require.resolve('@dr-js/core/module/common/verify')),
      resolve(__dirname, __dirname.includes('output-gitignore') ? '../' : './', '../../../../node_modules/@dr-js/core/')
    )

    strictEqual(
      findUpPackageRoot('/not/exist/path/'),
      undefined
    )
  })

  it('getPathNpmExecutable()', () => {
    doNotThrow(getPathNpmExecutable)

    info(`[getPathNpmExecutable] ${getPathNpmExecutable()}`)
  })

  it('getSudoArgs()', () => {
    doNotThrow(getSudoArgs)

    info(`[getSudoArgs] ${getSudoArgs()}`)
  })

  it('getPathNpmGlobalRoot()', () => {
    doNotThrow(getPathNpmGlobalRoot)

    info(`[getPathNpmGlobalRoot] ${getPathNpmGlobalRoot()}`)
    info(`[fromGlobalNodeModules] ${fromGlobalNodeModules('test-global-package-name')}`)
  })

  it('getPathNpm()', () => {
    doNotThrow(getPathNpm)

    info(`[getPathNpm] ${getPathNpm()}`)

    // dependency of npm, which is a LOT of package to borrow
    // strictEqual(require(fromNpmNodeModules('libnpx/package.json')).name, 'libnpx') // TODO: `npm@7` do not have a separate `npx`
    strictEqual(require(fromNpmNodeModules('semver/package.json')).name, 'semver')
    strictEqual(require(fromNpmNodeModules('tar/package.json')).name, 'tar')

    const npmVer = require(fromNpmNodeModules('../package.json')).version
    if (compareSemVer(npmVer, '10.0.0') < 0) {
      strictEqual(require(fromNpmNodeModules('agent-base/package.json')).name, 'agent-base')
      strictEqual(require(fromNpmNodeModules('http-proxy-agent/package.json')).name, 'http-proxy-agent')
      strictEqual(require(fromNpmNodeModules('https-proxy-agent/package.json')).name, 'https-proxy-agent')

      // HACK: check can borrow `make-fetch-happen/agent.js` for lazy proxy agent
      strictEqual(require(fromNpmNodeModules('make-fetch-happen/package.json')).name, 'make-fetch-happen')
    } else {
      strictEqual(require(fromNpmNodeModules('@npmcli/agent/package.json')).name, '@npmcli/agent')
    }

    { // test sample usage: https://www.npmjs.com/package/semver
      const semver = require(fromNpmNodeModules('semver'))
      truthy(semver.satisfies('1.2.3', '1.x || >=2.5.0 || 5.0.0 - 7.2.3'))
      strictEqual(semver.valid(semver.coerce('v2')), '2.0.0')
      strictEqual(semver.valid(semver.coerce('42.6.7.9.3-alpha')), '42.6.7')
    }
  })

  it('hasRepoVersion', async () => { // TODO: kinda slow
    truthy(await hasRepoVersion('@dr-js/core', '0.4.0'))
    truthy(!await hasRepoVersion('@dr-js/core', '0.4.0-version-should-not-exist'))
    truthy(!await hasRepoVersion('@dr-js/package-should-not-exist', '0.4.0'))
  })

  it('fetchWithJumpProxy', async () => {
    truthy((await fetchWithJumpProxy('https://dr.run', { jumpMax: 4 })).ok)
  })
})
