import { resolve, relative } from 'node:path'

import { toPosixPath } from 'source/node/fs/Path.js'
import { getFileList } from 'source/node/fs/Directory.js'
import { guardPromiseEarlyExit } from 'source/node/system/ExitListener.js'

import { createTest } from 'source/common/test.js'

import { color } from 'source/dev/node/color.js'

const getTestFilePairList = async ({
  testRoot = process.cwd(),
  testFileSuffixList = [ '.js' ]
}) => {
  const testPathFunc = (testFileSuffixList && testFileSuffixList.length)
    ? (path) => testFileSuffixList.find((testFileSuffix) => path.endsWith(testFileSuffix))
    : null
  const fileList = await getFileList(testRoot, testPathFunc
    ? (fileList, { path }) => { testPathFunc(path) && fileList.push(path) }
    : (fileList, { path }) => { fileList.push(path) }
  )
  if (!fileList.length) throw new Error([ 'no test file selected', `with suffix "${testFileSuffixList.join(',')}"`, `from ${testRoot}` ].filter(Boolean).join(' '))
  return fileList.map((file) => [ file, toPosixPath(relative(testRoot, file)) ])
}

const test = async ({
  testFilePairList = [], // [ [ file, relativeFile ] ]
  testTimeout = 42 * 1000
}) => {
  const { TEST_SETUP, TEST_RUN, describe } = createTest({ // setup colors
    colorError: color.red,
    colorMain: color.cyan,
    colorTitle: color.green,
    colorText: color.darkGray,
    colorTime: color.yellow
  })

  TEST_SETUP({ timeout: testTimeout })

  for (const [ file, relativeFile ] of testFilePairList) {
    try {
      describe( // add one more scope for file
        `[FILE] ${relativeFile}`,
        () => { require(file) }
      )
    } catch (error) {
      console.error(`failed to load test file "${file}"`)
      throw error
    }
  }

  const { passList, failList } = await guardPromiseEarlyExit(
    () => {
      console.error('[TEST] detected early exit, broken promise/async chain?')
      process.exitCode = 42
    },
    TEST_RUN()
  )

  const failCount = failList.length
  const testCount = passList.length + failCount
  if (failCount) throw new Error(`${failCount} of ${testCount} test fail from ${testFilePairList.length} file`)
}

const doTest = async ({
  testRootList = [ process.cwd() ],
  testFileSuffixList = [ '.js' ],
  testRequireList = [],
  testTimeout = 42 * 1000
}) => {
  const testFilePairList = []
  for (const testRoot of testRootList) {
    testFilePairList.push(...await getTestFilePairList({ testRoot, testFileSuffixList }))
  }
  for (const testRequire of testRequireList) { // load pre require, mostly `@babel/register`
    const target = /^[./]/.test(testRequire) ? resolve(testRequire) // script file, like `./a.js`, or `/b/c/d.js`
      : testRequire // module name, like `@dr-js/core`
    try { require(target) } catch (error) {
      console.error(`failed to require "${target}" (${testRequire})`)
      throw error
    }
  }
  await test({ testFilePairList, testTimeout })
}

export { doTest }
