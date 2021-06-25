import { setTimeoutAsync } from 'source/common/time.js'
import { createStatusBar } from './TerminalStatusBar.js'

const { describe, it, info = console.log } = global

const timeScale = __DEV__ ? 50 : 1

describe('Node.Module.TerminalStatusBar', () => {
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
