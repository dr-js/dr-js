import { resolve } from 'path'
import { createGzip, createGunzip, gzipSync } from 'zlib'
import { Writable } from 'stream'
import { strictEqual } from 'source/common/verify'
import { createReadStream, createWriteStream } from 'source/node/file/function'
import {
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

describe('Node.Data.Stream', () => {
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
