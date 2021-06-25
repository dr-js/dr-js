import { resolve } from 'path'
import { strictEqual, stringifyEqual, doNotThrow } from 'source/common/verify.js'

import {
  parsePackageNameAndVersion,
  findUpPackageRoot,
  getPathNpmExecutable, getSudoArgs,
  getPathNpmGlobalRoot, fromGlobalNodeModules,
  getPathNpm, fromNpmNodeModules,
  hasRepoVersion
} from './npm.js'

const { describe, it, info = console.log } = global

describe('Node.Module.Software.npm', () => {
  it('parsePackageNameAndVersion()', () => {
    stringifyEqual(parsePackageNameAndVersion('aaa@0.0.0'), [ 'aaa', '0.0.0' ])
    stringifyEqual(parsePackageNameAndVersion('aaa@'), [])
    stringifyEqual(parsePackageNameAndVersion('aaa'), [])

    stringifyEqual(parsePackageNameAndVersion('@aaa/aaa@0.0.0'), [ '@aaa/aaa', '0.0.0' ])
    stringifyEqual(parsePackageNameAndVersion('@aaa/aaa@'), [])
    stringifyEqual(parsePackageNameAndVersion('@aaa/aaa'), [])
  })

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

    strictEqual(require(fromNpmNodeModules('agent-base/package.json')).name, 'agent-base')
    strictEqual(require(fromNpmNodeModules('http-proxy-agent/package.json')).name, 'http-proxy-agent')
    strictEqual(require(fromNpmNodeModules('https-proxy-agent/package.json')).name, 'https-proxy-agent')

    // HACK: check can borrow `make-fetch-happen/agent.js` for lazy proxy agent
    strictEqual(require(fromNpmNodeModules('make-fetch-happen/package.json')).name, 'make-fetch-happen')

    { // test sample usage: https://www.npmjs.com/package/semver
      const semver = require(fromNpmNodeModules('semver'))
      strictEqual(semver.satisfies('1.2.3', '1.x || >=2.5.0 || 5.0.0 - 7.2.3'), true)
      strictEqual(semver.valid(semver.coerce('v2')), '2.0.0')
      strictEqual(semver.valid(semver.coerce('42.6.7.9.3-alpha')), '42.6.7')
    }
  })

  it('hasRepoVersion', async () => { // TODO: kinda slow
    strictEqual(await hasRepoVersion('@dr-js/core', '0.4.0'), true)
    strictEqual(await hasRepoVersion('@dr-js/core', '0.4.0-version-should-not-exist'), false)
    strictEqual(await hasRepoVersion('@dr-js/package-should-not-exist', '0.4.0'), false)
  })
})
