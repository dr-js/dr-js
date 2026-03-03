import { resolve } from 'node:path'

import { indentLine } from 'source/common/string.js'
import { stringifyEqual, doThrow, doNotThrow, doThrowAsync, doNotThrowAsync } from 'source/common/verify.js'
import { STAT_ERROR, getPathLstat } from 'source/node/fs/Path.js'
import { readTextSync } from 'source/node/fs/File.js'
import { resetDirectory } from 'source/node/fs/Directory.js'
import { modifyDelete } from 'source/node/fs/Modify.js'
import { getKitLogger } from 'source/node/kit.js'

import {
  initOutput,
  packOutput,
  // verifyOutputBin,
  verifyNoGitignore,
  verifyPackageVersionStrict,
  publishPackage
} from './output.js'

const { describe, it, before, after, info = console.log } = globalThis

const PATH_TEST_ROOT = resolve(__dirname, './test-output-gitignore/')
const PATH_ROOT = resolve(__dirname, __dirname.includes('output-gitignore') ? '../../' : '../')
if (!PATH_ROOT) throw new Error('unexpected PATH_ROOT')

before(() => resetDirectory(PATH_TEST_ROOT))
after(() => modifyDelete(PATH_TEST_ROOT))

describe('Output', () => {
  const fromTestRoot = (...args) => resolve(PATH_TEST_ROOT, ...args)
  const fromRoot = (...args) => resolve(PATH_ROOT, ...args) // use outer package
  const logList = []
  const kitLogger = getKitLogger({
    logFunc: (log) => {
      logList.unshift(log)
      logList.length = 8
      info(log)
    }
  })
  const verifyLog = (expectLog) => {
    if (logList.some((log) => log && log.includes(expectLog))) return
    throw new Error(`[verifyLog] expectLog: ${expectLog}, get:\n${logList.map((log) => indentLine(log, '  > ', ' >> ')).join('\n')}`)
  }

  it('initOutput()', async () => {
    const fromOutput = (...args) => fromTestRoot('output-initOutput', ...args)
    const replaceReadmeNonPackageContent = '\n\nTEST_REPLACE_README_NON_PACKAGE_CONTENT'

    await initOutput({
      fromOutput,
      fromRoot,
      // deleteKeyList = [ 'private', 'scripts', 'devDependencies' ],
      // copyPathList = [ 'README.md' ],
      copyMapPathList: [ [ '.gitignore', '.gitignore-map-0' ], [ '.gitignore', '.gitignore-map-1' ] ],
      replaceReadmeNonPackageContent, // set to false to skip
      // pathAutoLicenseFile = fromRoot('LICENSE'), // set to false, or do not set `packageJSON.license` to skip
      kitLogger
    })

    stringifyEqual(
      await getPathLstat(fromOutput('.gitignore')),
      STAT_ERROR,
      'should apply copyMapPathList'
    )
    stringifyEqual(
      readTextSync(fromRoot('.gitignore')),
      readTextSync(fromOutput('.gitignore-map-0')),
      'should apply copyMapPathList'
    )
    stringifyEqual(
      readTextSync(fromRoot('.gitignore')),
      readTextSync(fromOutput('.gitignore-map-1')),
      'should apply copyMapPathList'
    )
    stringifyEqual(
      readTextSync(fromOutput('README.md')).includes(replaceReadmeNonPackageContent),
      true,
      'should apply replaceReadmeNonPackageContent'
    )
  })

  it('packOutput()', async () => {
    const fromOutput = (...args) => fromTestRoot('output-packOutput', ...args)
    const packageJSON = await initOutput({ fromOutput, fromRoot, kitLogger })
    const pathPackagePack = await packOutput({ fromOutput, fromRoot: fromTestRoot, packageJSON, kitLogger })
    info(`[pathPackagePack]: ${pathPackagePack}`)
  })

  it('verifyNoGitignore()', async () => {
    await doNotThrowAsync(async () => verifyNoGitignore({ path: fromRoot('script'), kitLogger }))
    await doThrowAsync(async () => verifyNoGitignore({ path: fromTestRoot(), kitLogger }))
  })

  it('verifyPackageVersionStrict()', () => {
    doNotThrow(() => verifyPackageVersionStrict('1.1.1'))
    doNotThrow(() => verifyPackageVersionStrict('1111.1111.1111'))
    doNotThrow(() => verifyPackageVersionStrict('1.1.1-dev.1'))
    doNotThrow(() => verifyPackageVersionStrict('1111.1111.1111-dev.1111'))

    doThrow(() => verifyPackageVersionStrict(''))
    doThrow(() => verifyPackageVersionStrict('1'))
    doThrow(() => verifyPackageVersionStrict('1.1'))
    doThrow(() => verifyPackageVersionStrict('1.1.1.1'))
    doThrow(() => verifyPackageVersionStrict('1.1.1-dev.1-local.1'))
  })

  it('publishPackage()', async () => {
    const fromOutput = (...args) => fromTestRoot('output-publishPackage', ...args)
    const packageJSON = await initOutput({ fromOutput, fromRoot, kitLogger })
    const pathPackagePack = await packOutput({ fromOutput, fromRoot: fromTestRoot, kitLogger })

    packageJSON.version = '0.0.0-dev.0' // reset for test

    // should run all code, but pass "--dry-run" to npm and skip publish
    info('test publish with --dry-run')
    await publishPackage({ packageJSON, pathPackagePack, extraArgs: [ '--dry-run' ], kitLogger })
    verifyLog('0.0.0-dev.0')
  })
})
