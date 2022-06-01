import { resolve } from 'node:path'
import { createGzip, createGunzip, gzipSync } from 'node:zlib'
import { createReadStream, createWriteStream } from 'node:fs'
import { Stream, Readable, Writable, Duplex, PassThrough, Transform } from 'node:stream'
import { strictEqual, truthy } from 'source/common/verify.js'
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
import { deleteDirectory, resetDirectory } from 'source/node/fs/Directory.js'

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
const log = __DEV__ ? info : () => {}

const FILE_NOT_EXIST = resolve(__dirname, 'not-exist.txt')
const FILE_NOT_WRITABLE = resolve(__dirname, 'no-directory/no-directory/not-writable.txt')
const FILE_NOT_GZIP = resolve(__dirname, 'Stream.js') // plain test file

const unexpectedResolve = () => { throw new Error('unexpected promise resolve') }
const expectError = (content) => (error) => {
  if (String(error).includes(content)) log(`good, expected: ${error}`)
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
  await deleteDirectory(TEST_ROOT)
})

describe('Node.Data.Stream', () => {
  it('isReadableStream', () => {
    truthy(!isReadableStream(new Stream()))
    truthy(isReadableStream(new Readable()))
    truthy(!isReadableStream(new Writable()))
    truthy(isReadableStream(new Duplex()))
    truthy(isReadableStream(new PassThrough()))
    truthy(isReadableStream(new Transform()))
    truthy(isReadableStream(muteStreamError(createReadStream(FILE_NOT_EXIST))))
    truthy(!isReadableStream(muteStreamError(createWriteStream(FILE_NOT_WRITABLE))))
  })

  it('isWritableStream', () => {
    truthy(!isWritableStream(new Stream()))
    truthy(!isWritableStream(new Readable()))
    truthy(isWritableStream(new Writable()))
    truthy(isWritableStream(new Duplex()))
    truthy(isWritableStream(new PassThrough()))
    truthy(isWritableStream(new Transform()))
    truthy(!isWritableStream(muteStreamError(createReadStream(FILE_NOT_EXIST))))
    truthy(isWritableStream(muteStreamError(createWriteStream(FILE_NOT_WRITABLE))))
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
      log('Runlet with stream speed')
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
      log(`done: ${time(stepper())}`)
      __DEV__ && console.log(result)
      log('==== runlet.describe ====')
      log(describe().join('\n'))
    }

    { // test stream pipe
      log('Ref stream pipe speed')
      const stepper = createStepper()
      await waitStreamStopAsync(setupStreamPipe(
        createReadStream(TEST_INPUT),
        createGzip(),
        createWriteStream(TEST_OUTPUT + '-REF')
      ))
      log(`done: ${time(stepper())}`)
    }

    const outputBuffer = await readBuffer(TEST_OUTPUT)
    log(`outputBuffer size: ${binary(outputBuffer.length)}B`)
    strictEqual(outputBuffer.compare(await readBuffer(TEST_OUTPUT + '-REF')), 0)
  })

  it('quickRunletFromStream', async () => {
    log('Runlet with stream speed')
    const stepper = createStepper()
    const result = await quickRunletFromStream(
      createReadStream(TEST_INPUT),
      createGzip(),
      createGzip(),
      createWriteStream(TEST_OUTPUT + '-QUICK')
    )
    log(`done: ${time(stepper())}`)
    __DEV__ && console.log(result)

    const outputBuffer = await readBuffer(TEST_OUTPUT + '-QUICK')
    log(`outputBuffer size: ${binary(outputBuffer.length)}B`)

    stepper()
    const refBuffer = gzipSync(gzipSync(await readBuffer(TEST_INPUT)))
    log(`prepare refBuffer done: ${time(stepper())}`)
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
    truthy(process.stdout.writable)

    await quickRunletFromStream(
      bufferToReadableStream(Buffer.from('\nPONG\n')),
      process.stdout
    )
    truthy(process.stdout.writable)
  })
})
