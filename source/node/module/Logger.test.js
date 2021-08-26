import { resolve } from 'path'
import { strictEqual, truthy } from 'source/common/verify.js'
import { setTimeoutAsync } from 'source/common/time.js'
import { existPath } from 'source/node/fs/Path.js'
import { readTextSync } from 'source/node/fs/File.js'
import { resetDirectory } from 'source/node/fs/Directory.js'
import { modifyDelete } from 'source/node/fs/Modify.js'

import { createSimpleLoggerExot, createLoggerExot } from './Logger.js'

const { describe, it, before, after } = globalThis

const TEST_ROOT = resolve(__dirname, './test-logger-gitignore/')

const TIME_WAIT_SCALE = process.platform !== 'darwin' ? 1 : 10 // TODO: NOTE: macos fs seems to be late than linux/win32, so just wait longer

before(() => resetDirectory(TEST_ROOT))
after(() => modifyDelete(TEST_ROOT))

describe('Node.Module.Logger', () => {
  it('createSimpleLoggerExot()', async () => { // TODO: flaky test
    const pathOutputFile = resolve(TEST_ROOT, 'simple-logger')
    const { up, down, add, save } = createSimpleLoggerExot({ pathOutputFile, queueLengthThreshold: 4 })

    // support `add()` before `up()`
    add('1')
    add('2')
    truthy(!await existPath(pathOutputFile), 'should hold log in buffer')

    up()
    truthy(await existPath(pathOutputFile), 'should create log file but not write')

    add('3')
    add('4')
    await setTimeoutAsync(10 * TIME_WAIT_SCALE)
    strictEqual(readTextSync(pathOutputFile), '', 'should not write yet `<= queueLengthThreshold`')

    add('5')
    await setTimeoutAsync(10 * TIME_WAIT_SCALE)
    strictEqual(readTextSync(pathOutputFile), '1\n2\n3\n4\n5\n', 'should write to file `> queueLengthThreshold`')

    add('6')
    save()
    await setTimeoutAsync(10 * TIME_WAIT_SCALE)
    strictEqual(readTextSync(pathOutputFile), '1\n2\n3\n4\n5\n6\n', 'should write to file on manual `save`')

    add('7')
    down()
    await setTimeoutAsync(10 * TIME_WAIT_SCALE)
    strictEqual(readTextSync(pathOutputFile), '1\n2\n3\n4\n5\n6\n7\n', 'should write to file on `down`')
  })

  it('createLoggerExot()', async () => {
    let logFileIndex = 0
    const pathLogDirectory = resolve(TEST_ROOT, 'logger')
    const getCurrentLogPath = () => resolve(pathLogDirectory, `${logFileIndex}.log`)
    const { up, down, add, save, split } = createLoggerExot({
      pathLogDirectory,
      getLogFileName: () => {
        logFileIndex += 1
        return `${logFileIndex}.log`
      },
      queueLengthThreshold: 4,
      splitInterval: 100 * TIME_WAIT_SCALE
    })

    // support `add()` before `up()`
    add('1', 1)
    add('2')
    truthy(!await existPath(getCurrentLogPath()), 'should hold log in buffer')

    await up()
    truthy(await existPath(getCurrentLogPath()), 'should create log file but not write')

    add('3')
    add('4')
    await setTimeoutAsync(20 * TIME_WAIT_SCALE)
    strictEqual(readTextSync(getCurrentLogPath()), '', 'should not write yet `<= queueLengthThreshold`')

    add('5')
    await setTimeoutAsync(20 * TIME_WAIT_SCALE)
    strictEqual(readTextSync(getCurrentLogPath()), '1 1\n2\n3\n4\n5\n', 'should write to file `> queueLengthThreshold`')

    add('6')
    save()
    await setTimeoutAsync(20 * TIME_WAIT_SCALE)
    strictEqual(readTextSync(getCurrentLogPath()), '1 1\n2\n3\n4\n5\n6\n', 'should write to file on manual `save`')

    add('7 should manual split')
    split() // new file, reset split timer
    await setTimeoutAsync(20 * TIME_WAIT_SCALE)
    strictEqual(readTextSync(resolve(pathLogDirectory, `${logFileIndex - 1}.log`)), '1 1\n2\n3\n4\n5\n6\n7 should manual split\n', 'should write to file on manual `split`')
    strictEqual(readTextSync(getCurrentLogPath()), '', 'should change to new file on manual `split`')

    add('8', [ 'A' ])
    add('9', { k: 'v' }, 'should auto split')
    await setTimeoutAsync(90 * TIME_WAIT_SCALE) // 20 + 90ms since last split, so auto split should run
    strictEqual(readTextSync(resolve(pathLogDirectory, `${logFileIndex - 1}.log`)), '8 A\n9 [object Object] should auto split\n', 'should write to file on auto `split`')
    strictEqual(readTextSync(getCurrentLogPath()), '', 'should change to new file on auto `split`')

    add('10')
    add('11')
    down()
    await setTimeoutAsync(20 * TIME_WAIT_SCALE)
    strictEqual(readTextSync(resolve(pathLogDirectory, `${logFileIndex - 1}.log`)), '10\n11\n', 'should write to file on `down`')
    strictEqual(readTextSync(resolve(pathLogDirectory, `${logFileIndex - 2}.log`)), '8 A\n9 [object Object] should auto split\n')
    strictEqual(readTextSync(resolve(pathLogDirectory, `${logFileIndex - 3}.log`)), '1 1\n2\n3\n4\n5\n6\n7 should manual split\n')
  })
})
