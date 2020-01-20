import { Readable } from 'stream'
import { createInterface } from 'readline'

// TODO: NOTE: consider not directly use `stream.pipe()` for long-running code
//   Stream is a "trickier" version of Promise for data, think of promise without a proper `then` method
//   since the error handling is tricky, every stream in the pipe can and need to handle error and proper close
//   check:
//     - https://stackoverflow.com/questions/21771220/error-handling-with-node-js-streams
//     - https://stackoverflow.com/questions/34948095/how-to-properly-react-to-an-error-event-in-a-node-js-stream-pipe-line
//     - https://github.com/nodejs/node/blob/master/lib/internal/streams/pipeline.js (not solving the problem)
//   some pipe behaviors:
//     - auto close writableStream: `option.end = true` by default, stream.end() is called on the writableStream when the readableStream emits 'end', so that the destination is no longer writable
//     - auto unpipe readableStream: readableStream will unpipe when writableStream emits 'error'
//   for reliable using of stream pipe, here's some added assumptions:
//     - expect autoClose for stream, so no destroy on success, or error
//     - expect no unpipe for stream, so not check `unpipe` event
//     - expect no reuse for stream (prevent left-over event listener swallow event)
//     - once the stream is passed to a function, and not returned back, the stream error/end should be handled within
//     - thus for each stream: on error, wait up-stream unpipe, and the whole pipeline should then be ready for GC, or manually call destroy
//   the event listened:
//     - readableStream: error/close/end (no unpipe)
//     - writableStream: error/close/finish
//   so `handled` stream meaning:
//     - has event listened (and default not cleared)
//     - the stream should not be reused

// TODO: consider `Stream.pipeline` since node@>=10?
const setupStreamPipe = (...streamList) => { // the last stream is not handled, but will get error from all previous stream, so the pipe can be properly stopped
  const lastStream = streamList[ streamList.length - 1 ]
  const passError = (error) => lastStream.emit('error', error)
  for (let index = streamList.length - 2; index >= 0; index--) { // reverse & skip last
    streamList[ index ]
      .on('error', passError)
      .pipe(streamList[ index + 1 ])
  }
  return lastStream
}

// TODO: consider `Stream.finished` since node@>=10?
const waitStreamStopAsync = (stream) => new Promise((resolve, reject) => { // the stream is handled
  stream.on('error', reject)
  stream.on('close', () => reject(new Error('unexpected stream close'))) // for close before end, should already resolved for normal close
  stream.on('end', resolve) // for readableStream
  stream.on('finish', resolve) // for writableStream
})

const bufferToReadableStream = (buffer) => { // return stream not handled
  const readableStream = new Readable()
  readableStream.push(buffer)
  readableStream.push(null)
  return readableStream
}

const readableStreamToBufferAsync = (readableStream) => new Promise((resolve, reject) => { // the stream is handled
  const data = []
  readableStream.on('error', reject)
  readableStream.on('close', () => reject(new Error('unexpected stream close'))) // for close before end, should already resolved for normal close
  readableStream.on('end', () => resolve(Buffer.concat(data)))
  readableStream.on('data', (chunk) => data.push(chunk))
})

const writeBufferToStreamAsync = (writableStream, buffer) => new Promise((resolve, reject) => { // partially handled during write, will reset to not handled to allow reuse
  if (buffer.length === 0) return resolve() // for ServerResponse the callback will miss if the chunk is non-empty. https://nodejs.org/api/http.html#http_request_write_chunk_encoding_callback
  writableStream.once('error', reject)
  writableStream.write(buffer, () => {
    writableStream.off('error', reject) // allow reuse, so clean up
    resolve()
  })
})

// TODO: not able to pause & resume the line-reading to run some async code // use async mode could do this
const readlineOfStreamAsync = (
  readableStream, // the stream is handled
  onLineStringSync // should be sync function
) => new Promise((resolve, reject) => {
  const readlineInterface = createInterface({ input: readableStream, crlfDelay: Infinity })
  const doReject = (error) => {
    reject(error)
    readlineInterface.close()
  }
  readableStream.on('error', doReject)
  readlineInterface.on('error', doReject) // TODO: currently there's no 'error' event, check: https://github.com/nodejs/node/issues/30701
  readlineInterface.on('close', resolve)
  readlineInterface.on('line', (lineString) => {
    __DEV__ && console.log(`[Readline] line: ${lineString}`)
    onLineStringSync(lineString)
  })
})

export {
  setupStreamPipe,
  waitStreamStopAsync,
  bufferToReadableStream,
  readableStreamToBufferAsync,
  writeBufferToStreamAsync,
  readlineOfStreamAsync
}
