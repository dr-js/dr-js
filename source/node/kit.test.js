import { setTimeoutAsync } from 'source/common/time.js'
import {
  getKitLogger,
  getKitPathCombo
} from './kit.js'

const { describe, it, info = console.log } = globalThis

describe('Node.Kit', () => {
  it('getKitLogger()', async () => {
    const testKitLogger = (config) => {
      const kitLogger = getKitLogger({ padWidth: 76, logFunc: info, ...config })
      kitLogger.padLog('padLog', {}, [], () => {})
      kitLogger.stepLog('stepLog', {}, [], () => {})
      kitLogger.log('log', {}, [], () => {})
      kitLogger.devLog('devLog', {}, [], () => {})
    }
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
  })

  it('getKitPathCombo()', async () => {
    info(getKitPathCombo({ PATH_ROOT: '/aa/bb' }).fromOutput('cc', 'dd'))
  })
})
