import { resolve } from 'path'
import { createReadStream, createWriteStream, promises as fsAsync } from 'fs'
import { strictEqual } from 'source/common/verify'
import { createStepper } from 'source/common/time'
import { time, binary } from 'source/common/format'
import {
  createRunlet,
  createCountPool, PoolIO,
  ChipSyncBasic,
  toPoolMap, toChipMap, toLinearChipList, quickConfigPend
} from 'source/common/module/RunletDev'
import { setupStreamPipe, waitStreamStopAsync } from 'source/node/data/Stream'
import { createDirectory } from 'source/node/file/Directory'
import { modifyDelete } from 'source/node/file/Modify'

import {
  createReadableStreamInputChip,
  createWritableStreamOutputChip
} from './RunletDev'

const { describe, it, before, after, info = console.log } = global

const TEST_ROOT = resolve(__dirname, './test-runlet-gitignore/')
const TEST_SOURCE = resolve(__dirname, './RunletDev.js')
const TEST_INPUT = resolve(TEST_ROOT, './input')
const TEST_OUTPUT = resolve(TEST_ROOT, './output')

before('prepare', async () => {
  await createDirectory(TEST_ROOT)
  const sourceBuffer = await fsAsync.readFile(TEST_SOURCE)
  let loopCount = 2 ** 12 // will produce about 15MiB file
  while ((loopCount -= 1) !== 0) await fsAsync.appendFile(TEST_INPUT, sourceBuffer)
})
after('clear', async () => {
  await modifyDelete(TEST_ROOT)
})

describe('Node.Module.Runlet', () => {
  const poolKey = 'default'
  const samplePoolSizeLimit = 8

  it('createReadableStreamInputChip(), createWritableStreamOutputChip()', async () => {
    { // test stream pipe
      info('Ref stream pipe speed')
      const stepper = createStepper()
      await waitStreamStopAsync(setupStreamPipe(
        createReadStream(TEST_INPUT),
        createWriteStream(TEST_OUTPUT + '-REF')
      ))
      info(`done: ${time(stepper())}`)
    }

    info('Runlet with stream speed')
    const stepper = createStepper()

    const poolMap = toPoolMap([
      PoolIO,
      createCountPool({ key: poolKey, sizeLimit: samplePoolSizeLimit })
    ])
    const chipMap = toChipMap(toLinearChipList([
      createReadableStreamInputChip({ readableStream: createReadStream(TEST_INPUT) }),
      { ...ChipSyncBasic, key: undefined }, // add an extra sync pass through to increase difficulty
      createWritableStreamOutputChip({ key: 'out', writableStream: createWriteStream(TEST_OUTPUT) })
    ], { poolKey }))

    const { attach, trigger, describe } = createRunlet(quickConfigPend(poolMap, chipMap))
    attach()
    trigger()

    const result = await chipMap.get('out').promise
    info(`done: ${time(stepper())}`)
    __DEV__ && console.log(result)
    __DEV__ && info('==== runlet.describe ====')
    __DEV__ && info(describe().join('\n'))
    const inputBuffer = await fsAsync.readFile(TEST_INPUT)
    __DEV__ && info('inputBuffer size:', binary(inputBuffer.length))
    strictEqual(inputBuffer.compare(await fsAsync.readFile(TEST_OUTPUT)), 0)
  })
})
