import { doThrow, stringifyEqual } from 'source/common/verify.js'
import { setTimeoutAsync } from './time.js'
import { createTest } from './test.js'

const { describe, it, info = console.log } = globalThis
const log = __DEV__ ? info : () => {}

const quickTestSetup = () => {
  const TEST_GLOBAL = {}
  createTest().TEST_SETUP({ log, testGlobal: TEST_GLOBAL })
  return TEST_GLOBAL
}

const quickTestRunAsync = async (setupFunc, expectResult) => {
  const TEST_GLOBAL = {}
  const { TEST_SETUP, TEST_RUN } = createTest()
  TEST_SETUP({ log, testGlobal: TEST_GLOBAL })
  await setupFunc(TEST_GLOBAL)
  const RESULT = await TEST_RUN()
  TEST_GLOBAL.info('[RESULT]', JSON.stringify(RESULT))
  stringifyEqual(RESULT, expectResult)
}

describe('Common.Test', () => {
  it('TEST_SETUP() check', () => {
    doThrow(() => { createTest().describe('', () => {}) })
    doThrow(() => { createTest().before('', () => {}) })
    doThrow(() => { createTest().it('', () => {}) })
    doThrow(() => { createTest().after('', () => {}) })

    createTest().info('nothing')
  })

  it('describe() should check argList type', () => {
    doThrow(() => { quickTestSetup().describe(0) })
    doThrow(() => { quickTestSetup().describe([]) })
    doThrow(() => { quickTestSetup().describe({}) })
    doThrow(() => { quickTestSetup().describe(() => {}) })
    doThrow(() => { quickTestSetup().describe('', 0) })
    doThrow(() => { quickTestSetup().describe('', []) })
    doThrow(() => { quickTestSetup().describe('', {}) })
    doThrow(() => { quickTestSetup().describe('', async () => {}) })
    doThrow(() => { quickTestSetup().describe('', () => { throw new Error('setup-error') }) })

    quickTestSetup().describe('', () => {})
    quickTestSetup().describe('', function () {})
  })

  it('before/it/after() should check argList type', () => {
    const runTest = (key) => {
      doThrow(() => { quickTestSetup()[ key ](0) })
      doThrow(() => { quickTestSetup()[ key ]([]) })
      doThrow(() => { quickTestSetup()[ key ]({}) })
      doThrow(() => { quickTestSetup()[ key ]('', 0) })
      doThrow(() => { quickTestSetup()[ key ]('', []) })
      doThrow(() => { quickTestSetup()[ key ]('', {}) })

      quickTestSetup()[ key ]('', () => {})
      quickTestSetup()[ key ]('', function () {})
      quickTestSetup()[ key ]('', async () => {})
      quickTestSetup()[ key ]('', async function () {})
      quickTestSetup()[ key ]('', () => { throw new Error('setup-error') }) // not run

      // allow no title
      quickTestSetup()[ key ](() => {})
      quickTestSetup()[ key ](function () {})
      quickTestSetup()[ key ](async () => {})
      quickTestSetup()[ key ](async function () {})
      quickTestSetup()[ key ](() => { throw new Error('setup-error') }) // not run
    }

    runTest('before')
    runTest('it')
    runTest('after')
  })

  it('createTest() should run basic test setup', async () => quickTestRunAsync(async (TEST_GLOBAL) => {
    await setTimeoutAsync(0)
    TEST_GLOBAL.describe('[describe-0]', () => {
      TEST_GLOBAL.info('describe-info-0')
      TEST_GLOBAL.describe('[describe-0-0]', () => {
        TEST_GLOBAL.info('describe-info-0-0')
        // allow empty describe
      })
      TEST_GLOBAL.describe('[describe-0-1]', () => {
        TEST_GLOBAL.after('[after-0-0]', () => { TEST_GLOBAL.info('after-info-0-0') })
        TEST_GLOBAL.info('describe-info-0-1')
        TEST_GLOBAL.it('[test-0-0]', () => { TEST_GLOBAL.info('test-info-0-0') })
        TEST_GLOBAL.it('[test-0-1]', async () => {
          await setTimeoutAsync(0)
          TEST_GLOBAL.info('test-info-0-1')
        })
        TEST_GLOBAL.it('[test-0-2]', () => { TEST_GLOBAL.info('test-info-0-2') })
        TEST_GLOBAL.before('[before-0-0]', () => { TEST_GLOBAL.info('before-info-0-0') })
      })
    })
    TEST_GLOBAL.after('[after-0]', () => { TEST_GLOBAL.info('after-info-0') })
    TEST_GLOBAL.before('[before-0]', () => { TEST_GLOBAL.info('before-info-0') })
    TEST_GLOBAL.it('[test-1]', () => { TEST_GLOBAL.info('test-info-1') })
    TEST_GLOBAL.after('[after-1]', () => { TEST_GLOBAL.info('after-info-1') })
    TEST_GLOBAL.before('[before-1]', () => { TEST_GLOBAL.info('before-info-1') })
  }, {
    'passList': [ { 'title': '[before-0]' }, { 'title': '[before-1]' }, { 'title': '[before-0-0]' }, { 'title': '[test-0-0]' }, { 'title': '[test-0-1]' }, { 'title': '[test-0-2]' }, { 'title': '[after-0-0]' }, { 'title': '[test-1]' }, { 'title': '[after-0]' }, { 'title': '[after-1]' } ],
    'failList': []
  }))

  it('createTest() it-in-it should error', async () => quickTestRunAsync((TEST_GLOBAL) => {
    TEST_GLOBAL.it('[test-0]', async () => {
      await setTimeoutAsync(0)
      TEST_GLOBAL.info('test-info-0')
      TEST_GLOBAL.it('[test-0-0]', async () => {
        await setTimeoutAsync(0)
        TEST_GLOBAL.info('test-info-0-0')
      })
    })
  }, {
    'passList': [],
    'failList': [ { 'titleStack': [ 'root', '[test-0]' ], 'error': {} } ]
  }))
})
