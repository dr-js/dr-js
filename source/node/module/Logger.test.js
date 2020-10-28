import { resolve } from 'path'
import { readFileSync } from 'fs'
import { strictEqual } from 'source/common/verify'
import { setTimeoutAsync } from 'source/common/time'
import { existPath } from 'source/node/file/Path'
import { modifyDelete } from 'source/node/file/Modify'
import { resetDirectory } from '@dr-js/dev/module/node/file'

import { createSimpleLoggerExot, createLoggerExot } from './Logger'

const { describe, it, before, after } = global

const TEST_ROOT = resolve(__dirname, './test-logger-gitignore/')

before('prepare', () => resetDirectory(TEST_ROOT))
after('clear', () => modifyDelete(TEST_ROOT))

describe('Node.Module.Logger', () => {
  it('createSimpleLoggerExot()', async () => { // TODO: flaky test
    const pathOutputFile = resolve(TEST_ROOT, 'simple-logger')
    const { up, down, add, save } = createSimpleLoggerExot({ pathOutputFile, queueLengthThreshold: 4 })

    // support `add()` before `up()`
    add('1')
    add('2')
    strictEqual(await existPath(pathOutputFile), false, 'should hold log in buffer')

    up()
    strictEqual(await existPath(pathOutputFile), true, 'should create log file but not write')

    add('3')
    add('4')
    await setTimeoutAsync(10)
    strictEqual(String(readFileSync(pathOutputFile)), '', 'should not write yet `<= queueLengthThreshold`')

    add('5')
    await setTimeoutAsync(10)
    strictEqual(String(readFileSync(pathOutputFile)), '1\n2\n3\n4\n5\n', 'should write to file `> queueLengthThreshold`')

    add('6')
    save()
    await setTimeoutAsync(10)
    strictEqual(String(readFileSync(pathOutputFile)), '1\n2\n3\n4\n5\n6\n', 'should write to file on manual `save`')

    add('7')
    down()
    await setTimeoutAsync(10)
    strictEqual(String(readFileSync(pathOutputFile)), '1\n2\n3\n4\n5\n6\n7\n', 'should write to file on `down`')
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
      splitInterval: 100
    })

    // support `add()` before `up()`
    add('1', 1)
    add('2')
    strictEqual(await existPath(getCurrentLogPath()), false, 'should hold log in buffer')

    await up()
    strictEqual(await existPath(getCurrentLogPath()), true, 'should create log file but not write')

    add('3')
    add('4')
    await setTimeoutAsync(20)
    strictEqual(String(readFileSync(getCurrentLogPath())), '', 'should not write yet `<= queueLengthThreshold`')

    add('5')
    await setTimeoutAsync(20)
    strictEqual(String(readFileSync(getCurrentLogPath())), '1 1\n2\n3\n4\n5\n', 'should write to file `> queueLengthThreshold`')

    add('6')
    save()
    await setTimeoutAsync(20)
    strictEqual(String(readFileSync(getCurrentLogPath())), '1 1\n2\n3\n4\n5\n6\n', 'should write to file on manual `save`')

    add('7 should manual split')
    split() // new file, reset split timer
    await setTimeoutAsync(20)
    strictEqual(String(readFileSync(resolve(pathLogDirectory, `${logFileIndex - 1}.log`))), '1 1\n2\n3\n4\n5\n6\n7 should manual split\n', 'should write to file on manual `split`')
    strictEqual(String(readFileSync(getCurrentLogPath())), '', 'should change to new file on manual `split`')

    add('8', [ 'A' ])
    add('9', { k: 'v' }, 'should auto split')
    await setTimeoutAsync(90) // 20 + 90ms since last split, so auto split should run
    strictEqual(String(readFileSync(resolve(pathLogDirectory, `${logFileIndex - 1}.log`))), '8 A\n9 [object Object] should auto split\n', 'should write to file on auto `split`')
    strictEqual(String(readFileSync(getCurrentLogPath())), '', 'should change to new file on auto `split`')

    add('10')
    add('11')
    down()
    await setTimeoutAsync(20)
    strictEqual(String(readFileSync(resolve(pathLogDirectory, `${logFileIndex - 1}.log`))), '10\n11\n', 'should write to file on `down`')
    strictEqual(String(readFileSync(resolve(pathLogDirectory, `${logFileIndex - 2}.log`))), '8 A\n9 [object Object] should auto split\n')
    strictEqual(String(readFileSync(resolve(pathLogDirectory, `${logFileIndex - 3}.log`))), '1 1\n2\n3\n4\n5\n6\n7 should manual split\n')
  })
})
