import { stringifyEqual, notStringifyEqual } from 'source/common/verify.js'
import { setTimeoutAsync } from 'source/common/time.js'
import {
  loadEnvKey, saveEnvKey,
  ENV_KEY_LOGGER, ENV_KEY_VERBOSE,
  getKitLogger,
  getKitPathCombo
} from './kit.js'

const { describe, it, info = console.log } = globalThis

describe('Node.Kit', () => {
  it('getKitLogger()', async () => {
    const testKitLogger = (config) => {
      const kitLogger = getKitLogger({ isNoEnvKey: true, padWidth: 76, logFunc: info, ...config })
      kitLogger.padLog('padLog', {}, [], () => {})
      kitLogger.stepLog('stepLog', {}, [], () => {})
      kitLogger.log('log', {}, [], () => {})
      kitLogger.devLog('devLog', {}, [], () => {})
    }

    const envLogger = loadEnvKey(ENV_KEY_LOGGER)
    const envVerbose = loadEnvKey(ENV_KEY_VERBOSE)

    info('== basic ==')
    testKitLogger()
    await setTimeoutAsync(5)
    info('== quiet ==')
    testKitLogger({ title: 'quiet', isQuiet: true })
    await setTimeoutAsync(5)
    info('== verbose ==')
    testKitLogger({ title: 'verbose', isVerbose: true })
    await setTimeoutAsync(5)
    info('== quiet + verbose ==')
    testKitLogger({ title: 'quiet+verbose', isQuiet: true, isVerbose: true })

    stringifyEqual(loadEnvKey(ENV_KEY_LOGGER), envLogger, 'should not make change to env key')
    stringifyEqual(loadEnvKey(ENV_KEY_VERBOSE), envVerbose, 'should not make change to env key')

    info('== env-key ==')
    testKitLogger({ isNoEnvKey: false })
    await setTimeoutAsync(5)

    notStringifyEqual(loadEnvKey(ENV_KEY_LOGGER), envLogger, 'should change env key')
    // notStringifyEqual(loadEnvKey(ENV_KEY_VERBOSE), envVerbose, 'should change env key') // might be the same

    // NOTE: restore outer env key
    saveEnvKey(ENV_KEY_LOGGER, envLogger)
    saveEnvKey(ENV_KEY_VERBOSE, envVerbose)
  })

  it('getKitPathCombo()', async () => {
    info(getKitPathCombo({ PATH_ROOT: '/aa/bb' }).fromOutput('cc', 'dd'))
  })
})
