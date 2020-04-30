import { resolve } from 'path'
import { createGzip, createGunzip, gzipSync } from 'zlib'
import { createReadStream, createWriteStream } from 'fs'
import { Stream, Readable, Writable, Duplex, PassThrough, Transform } from 'stream'
import { strictEqual } from 'source/common/verify'
import {
  isReadableStream, isWritableStream,
  setupStreamPipe,
  waitStreamStopAsync,
  bufferToReadableStream,
  readableStreamToBufferAsync,
  writeBufferToStreamAsync,
  readlineOfStreamAsync
} from './Stream'

const { describe, it, info = console.log } = global

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
})
