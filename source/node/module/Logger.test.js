import { resolve } from 'path'
import { readFileSync, statSync } from 'fs'
import { strictEqual } from 'source/common/verify'
import { setTimeoutAsync } from 'source/common/time'
import { createDirectory } from 'source/node/file/Directory'
import { modifyDelete } from 'source/node/file/Modify'
import { createSimpleLoggerExot, createLoggerExot } from './Logger'

const { describe, it, before, after } = global

const TEST_ROOT = resolve(__dirname, './test-logger-gitignore/')

before('prepare', () => createDirectory(TEST_ROOT))
after('clear', () => modifyDelete(TEST_ROOT))

describe('Node.Module.Logger', () => {
  it('createSimpleLoggerExot()', async () => {
    const pathOutputFile = resolve(TEST_ROOT, 'simple-logger')
    const { up, down, add, save } = createSimpleLoggerExot({ pathOutputFile, queueLengthThreshold: 4 })
    up()
    let size, prevSize

    add('1')
    add('2')
    add('3')
    add('4')
    await setTimeoutAsync(10)
    size = statSync(pathOutputFile).size
    // console.log('4', size)
    strictEqual(size, 0)

    add('5')
    await setTimeoutAsync(10)
    size = statSync(pathOutputFile).size
    // console.log('5', size)
    strictEqual(size > 0, true)
    prevSize = size

    add('6')
    save()
    await setTimeoutAsync(10)
    size = statSync(pathOutputFile).size
    // console.log('6', size)
    strictEqual(size > prevSize, true)
    prevSize = size

    add('7')
    down()
    await setTimeoutAsync(10)
    size = statSync(pathOutputFile).size
    // console.log('7', size)
    strictEqual(size > prevSize, true)

    strictEqual(readFileSync(pathOutputFile, { encoding: 'utf8' }), '1\n2\n3\n4\n5\n6\n7\n')
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
    await up()
    let size, prevSize

    add('1', 1)
    add('2')
    add('3')
    add('4')
    await setTimeoutAsync(20)
    size = statSync(getCurrentLogPath()).size
    // console.log('4', size)
    strictEqual(size, 0, 'check 0')

    add('5')
    await setTimeoutAsync(20)
    size = statSync(getCurrentLogPath()).size
    // console.log('5', statSync(getCurrentLogPath()))
    strictEqual(size > 0, true, 'check 1')
    prevSize = size

    add('6')
    save()
    await setTimeoutAsync(20)
    size = statSync(getCurrentLogPath()).size
    // console.log('6', size)
    strictEqual(size > prevSize, true, 'check 2')
    prevSize = size

    add('7 should manual split')
    split() // new file, reset split timer
    await setTimeoutAsync(20)
    strictEqual(statSync(resolve(pathLogDirectory, `${logFileIndex - 1}.log`)).size > prevSize, true, 'check 3')
    size = statSync(getCurrentLogPath()).size
    // console.log('7', size)
    strictEqual(size, 0, 'check 4')
    prevSize = size

    add('8', [ 'A' ])
    add('9', { k: 'v' }, 'should auto split')
    await setTimeoutAsync(90) // 20 + 90ms since last split, so auto split should run
    strictEqual(statSync(resolve(pathLogDirectory, `${logFileIndex - 1}.log`)).size > prevSize, true, 'check 5')
    size = statSync(getCurrentLogPath()).size
    // console.log('9', size)
    strictEqual(size, 0, 'check 6')
    prevSize = size

    add('10')
    add('11')
    down()
    await setTimeoutAsync(20)
    size = statSync(getCurrentLogPath()).size
    // console.log('11', size)
    strictEqual(size > prevSize, true, 'check 7')

    strictEqual(readFileSync(resolve(pathLogDirectory, `${logFileIndex - 2}.log`), { encoding: 'utf8' }), '1 1\n2\n3\n4\n5\n6\n7 should manual split\n')
    strictEqual(readFileSync(resolve(pathLogDirectory, `${logFileIndex - 1}.log`), { encoding: 'utf8' }), `8 A\n9 ${{}} should auto split\n`)
    strictEqual(readFileSync(getCurrentLogPath(), { encoding: 'utf8' }), '10\n11\n')
  })
})
