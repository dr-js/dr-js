import { setTimeoutAsync } from 'source/common/time.js'
import {
  createColor,
  createStatusBar
} from './TerminalTTY.js'

const { describe, it, info = console.log } = globalThis

const timeScale = __DEV__ ? 50 : 1

describe('Node.Module.TerminalTTY', () => {
  it('createColor()', async () => {
    const Color = createColor()
    info(`Color.fg.red('test color'): ${Color.fg.red('test color')}`)
    info(`Color.bg.darkGray('test color'): ${Color.bg.darkGray('test color')}`)
  })

  it('createStatusBar()', async () => {
    const { update, done } = createStatusBar({ throttleWait: 20 * timeScale })

    update('SKIP')
    update('SKIP')
    update('SKIP')
    update('should throttle and show last updated text')

    await setTimeoutAsync(30 * timeScale)

    update('should-trim-long-text'.repeat(999))

    await setTimeoutAsync(30 * timeScale)

    update('SKIP') // should skip throttled update if already done
    await setTimeoutAsync(10 * timeScale)
    done()

    info('done')
  })
})
