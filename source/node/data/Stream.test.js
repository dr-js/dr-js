import { resolve } from 'path'
import { createGzip, createGunzip, gzipSync } from 'zlib'
import { createReadStream, createWriteStream } from 'fs'
import { Stream, Readable, Writable, Duplex, PassThrough, Transform } from 'stream'
import { strictEqual } from 'source/common/verify.js'
import { createStepper } from 'source/common/time.js'
import { time, binary } from 'source/common/format.js'
import { getSample } from 'source/common/math/sample.js'
import {
  createRunlet,
  createCountPool, PoolIO,
  ChipSyncBasic,
  toPoolMap, toChipMap, toLinearChipList, quickConfigPend
} from 'source/common/module/Runlet.js'
import { readBuffer, appendBuffer } from 'source/node/fs/File.js'
import { resetDirectory } from 'source/node/fs/Directory.js'
import { modifyDelete } from 'source/node/fs/Modify.js'

import {
  isReadableStream, isWritableStream,
  setupStreamPipe,
  waitStreamStopAsync,
  bufferToReadableStream,
  readableStreamToBufferAsync,
  writeBufferToStreamAsync,
  readlineOfStreamAsync,

  createReadableStreamInputChip,
  createWritableStreamOutputChip,
  createTransformStreamChip,
  quickRunletFromStream
} from './Stream.js'

const { describe, it, before, after, info = console.log } = globalThis

const FILE_NOT_EXIST = resolve(__dirname, 'not-exist.txt')
const FILE_NOT_WRITABLE = resolve(__dirname, 'no-directory/no-directory/not-writable.txt')
const FILE_NOT_GZIP = resolve(__dirname, 'Stream.js') // plain test file

const unexpectedResolve = () => { throw new Error('unexpected promise resolve') }
const expectError = (content) => (error) => {
  if (String(error).includes(content)) info(`good, expected: ${error}`)
  else throw new Error(`unexpected: ${error.stack || error}`)
}

const muteStreamError = (stream) => {
  stream.on('error', () => {})
  return stream
}

const TEST_ROOT = resolve(__dirname, './test-runlet-gitignore/')
const TEST_SOURCE = resolve(__dirname, './Stream.js')
const TEST_INPUT = resolve(TEST_ROOT, './input')
const TEST_OUTPUT = resolve(TEST_ROOT, './output')

before(async () => {
  await resetDirectory(TEST_ROOT)
  const sourceBuffer = await readBuffer(TEST_SOURCE)
  const concatBuffer = Buffer.concat(getSample(() => sourceBuffer, 2 ** 6)) // TODO: NOTE: GitHub CI darwin fs is slow, 4096 small append will hit the default timeout 42sec, so pre-concat for now
  let loopCount = Math.ceil((32 * 1024 * 1024) / concatBuffer.length) // will produce ~32MiB file
  while ((loopCount -= 1) !== 0) await appendBuffer(TEST_INPUT, concatBuffer)
})
after(async () => {
  await modifyDelete(TEST_ROOT)
})

describe('Node.Data.Stream', () => {
  it('isReadableStream', () => {
    strictEqual(isReadableStream(new Stream()), false)
    strictEqual(isReadableStream(new Readable()), true)
    strictEqual(isReadableStream(new Writable()), false)
    strictEqual(isReadableStream(new Duplex()), true)
    strictEqual(isReadableStream(new PassThrough()), true)
    strictEqual(isReadableStream(new Transform()), true)
    strictEqual(isReadableStream(muteStreamError(createReadStream(FILE_NOT_EXIST))), true)
    strictEqual(isReadableStream(muteStreamError(createWriteStream(FILE_NOT_WRITABLE))), false)
  })

  it('isWritableStream', () => {
    strictEqual(isWritableStream(new Stream()), false)
    strictEqual(isWritableStream(new Readable()), false)
    strictEqual(isWritableStream(new Writable()), true)
    strictEqual(isWritableStream(new Duplex()), true)
    strictEqual(isWritableStream(new PassThrough()), true)
    strictEqual(isWritableStream(new Transform()), true)
    strictEqual(isWritableStream(muteStreamError(createReadStream(FILE_NOT_EXIST))), false)
    strictEqual(isWritableStream(muteStreamError(createWriteStream(FILE_NOT_WRITABLE))), true)
  })

  it('createReadStream error', async () => waitStreamStopAsync(
    createReadStream(FILE_NOT_EXIST) // do not immediately throw Error
  ).then(unexpectedResolve, expectError('ENOENT')))

  it('createWriteStream error', async () => waitStreamStopAsync(
    createWriteStream(FILE_NOT_WRITABLE) // do not immediately throw Error
  ).then(unexpectedResolve, expectError('ENOENT')))

  it('waitStreamStopAsync + setupStreamPipe normal', async () => waitStreamStopAsync(setupStreamPipe(
    createReadStream(FILE_NOT_GZIP),
    createGzip(), createGunzip(),
    createGzip(), createGzip(), createGunzip(), createGunzip()
  )))

  it('waitStreamStopAsync + setupStreamPipe error 0', async () => waitStreamStopAsync(setupStreamPipe(
    createReadStream(FILE_NOT_EXIST), // error here
    createGunzip() // error here, but should not fire
  )).then(unexpectedResolve, expectError('ENOENT')))

  it('waitStreamStopAsync + setupStreamPipe error 1', async () => waitStreamStopAsync(setupStreamPipe(
    createReadStream(FILE_NOT_GZIP),
    createGunzip() // error here
  )).then(unexpectedResolve, expectError('incorrect header check')))

  it('waitStreamStopAsync + setupStreamPipe error 2', async () => waitStreamStopAsync(setupStreamPipe(
    createReadStream(FILE_NOT_GZIP),
    createGzip(), createGunzip(),
    createGzip(), createGzip(), createGunzip(), createGunzip(),
    createGunzip(), // error here
    createGzip(), createGunzip(),
    createGzip(), createGzip(), createGunzip(), createGunzip()
  )).then(unexpectedResolve, expectError('incorrect header check')))

  it('readlineOfStreamAsync normal', async () => readlineOfStreamAsync(
    setupStreamPipe(
      createReadStream(FILE_NOT_GZIP),
      createGzip(), createGunzip()
    ),
    (lineString) => {} // drop lineString
  ))

  it('readlineOfStreamAsync error 0', async () => readlineOfStreamAsync(
    setupStreamPipe(
      createReadStream(FILE_NOT_EXIST), // error here
      createGzip(),
      createGzip()
    ),
    (lineString) => {} // drop lineString
  ).then(unexpectedResolve, expectError('ENOENT')))

  it('readlineOfStreamAsync error 1', async () => readlineOfStreamAsync(
    setupStreamPipe(
      createReadStream(FILE_NOT_GZIP),
      createGzip(), createGunzip(),
      createGunzip() // error here
    ),
    (lineString) => {} // drop lineString
  ).then(unexpectedResolve, expectError('incorrect header check')))

  it('bufferToReadableStream + readableStreamToBufferAsync', async () => {
    const buffer = await readableStreamToBufferAsync(createReadStream(FILE_NOT_GZIP))
    const bufferGzip = await readableStreamToBufferAsync(setupStreamPipe(
      bufferToReadableStream(buffer),
      createGzip()
    ))
    strictEqual(Buffer.compare(gzipSync(buffer), bufferGzip), 0)
  })

  it('writeBufferToStreamAsync', async () => {
    const buffer = await readableStreamToBufferAsync(createReadStream(FILE_NOT_GZIP))
    const gzipStream = createGzip()
    const chunkList = []
    await Promise.all([
      waitStreamStopAsync(setupStreamPipe(
        gzipStream,
        new Writable({
          write (chunk, encoding, callback) {
            chunkList.push(chunk)
            callback()
          }
        })
      )),
      writeBufferToStreamAsync(gzipStream, buffer).then(() => gzipStream.end())
    ])
    const bufferGzip = Buffer.concat(chunkList)
    strictEqual(Buffer.compare(gzipSync(buffer), bufferGzip), 0)
  })

  const poolKey = 'default'
  const samplePoolSizeLimit = 8
  it('createReadableStreamInputChip/createWritableStreamOutputChip/createTransformStreamChip', async () => {
    {
      info('Runlet with stream speed')
      const stepper = createStepper()

      const poolMap = toPoolMap([
        PoolIO,
        createCountPool({ key: poolKey, sizeLimit: samplePoolSizeLimit })
      ])
      const chipMap = toChipMap(toLinearChipList([
        createReadableStreamInputChip({ stream: createReadStream(TEST_INPUT) }),
        createTransformStreamChip({ stream: createGzip() }),
        { ...ChipSyncBasic, key: undefined }, // add an extra sync pass through to increase difficulty
        createWritableStreamOutputChip({ key: 'out', stream: createWriteStream(TEST_OUTPUT) })
      ], { poolKey }))

      const { attach, trigger, describe } = createRunlet(quickConfigPend(poolMap, chipMap))
      attach()
      trigger()

      const result = await chipMap.get('out').promise
      info(`done: ${time(stepper())}`)
      __DEV__ && console.log(result)
      __DEV__ && info('==== runlet.describe ====')
      __DEV__ && info(describe().join('\n'))
    }

    { // test stream pipe
      info('Ref stream pipe speed')
      const stepper = createStepper()
      await waitStreamStopAsync(setupStreamPipe(
        createReadStream(TEST_INPUT),
        createGzip(),
        createWriteStream(TEST_OUTPUT + '-REF')
      ))
      info(`done: ${time(stepper())}`)
    }

    const outputBuffer = await readBuffer(TEST_OUTPUT)
    __DEV__ && info(`outputBuffer size: ${binary(outputBuffer.length)}B`)
    strictEqual(outputBuffer.compare(await readBuffer(TEST_OUTPUT + '-REF')), 0)
  })

  it('quickRunletFromStream', async () => {
    info('Runlet with stream speed')
    const stepper = createStepper()
    const result = await quickRunletFromStream(
      createReadStream(TEST_INPUT),
      createGzip(),
      createGzip(),
      createWriteStream(TEST_OUTPUT + '-QUICK')
    )
    info(`done: ${time(stepper())}`)
    __DEV__ && console.log(result)

    const outputBuffer = await readBuffer(TEST_OUTPUT + '-QUICK')
    __DEV__ && info(`outputBuffer size: ${binary(outputBuffer.length)}B`)

    stepper()
    const refBuffer = gzipSync(gzipSync(await readBuffer(TEST_INPUT)))
    info(`prepare refBuffer done: ${time(stepper())}`)
    strictEqual(outputBuffer.compare(refBuffer), 0)
  })

  it('quickRunletFromStream error 0', async () => quickRunletFromStream(
    createReadStream(FILE_NOT_EXIST), // error here
    createGunzip() // error here, but should not fire
  ).then(unexpectedResolve, expectError('ENOENT')))

  it('quickRunletFromStream error 1', async () => quickRunletFromStream(
    createReadStream(FILE_NOT_GZIP),
    createGunzip() // error here
  ).then(unexpectedResolve, expectError('incorrect header check')))

  it('quickRunletFromStream error 2', async () => quickRunletFromStream(
    createReadStream(FILE_NOT_GZIP),
    createGzip(), createGunzip(),
    createGzip(), createGzip(), createGunzip(), createGunzip(),
    createGunzip(), // error here
    createGzip(), createGunzip(),
    createGzip(), createGzip(), createGunzip(), createGunzip()
  ).then(unexpectedResolve, expectError('incorrect header check')))

  it('quickRunletFromStream stdout should keepOpen', async () => {
    await quickRunletFromStream(
      bufferToReadableStream(Buffer.from('\nPING\n')),
      process.stdout
    )
    strictEqual(process.stdout.writable, true)

    await quickRunletFromStream(
      bufferToReadableStream(Buffer.from('\nPONG\n')),
      process.stdout
    )
    strictEqual(process.stdout.writable, true)
  })
})
