import { Readable } from 'stream'
import { createInterface } from 'readline'

import { isObjectAlike, isBasicFunction } from 'source/common/check'
import { createInsideOutPromise } from 'source/common/function'
import {
  END, SKIP, REDO,
  createPack,
  KEY_POOL_IO, KEY_PEND_INPUT, KEY_PEND_OUTPUT
} from 'source/common/module/Runlet'

// edited from: https://github.com/sindresorhus/is-stream
const isReadableStream = (stream) => (
  isObjectAlike(stream) &&
  stream.readable !== false &&
  isBasicFunction(stream.pipe) &&
  isBasicFunction(stream._read)
)

const isWritableStream = (stream) => (
  isObjectAlike(stream) &&
  stream.writable !== false &&
  isBasicFunction(stream._write)
)

// NOTE: consider not directly use `stream.pipe()` for long-running code
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

// TODO: consider `Stream.pipeline` since node@>=10? (though the implementation make much more assumption)
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

// TODO: consider `Stream.finished` since node@>=10? (though the implementation make much more assumption)
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

const createReadableStreamInputChip = ({
  readableStream, readSize, // default to 16K or 16, check: https://nodejs.org/api/stream.html#stream_new_stream_readable_options
  key = 'chip:input:stream-readable', ...extra
}) => {
  const state = {
    error: undefined,
    isEnd: false, isReadable: false, eventIOP: undefined
  }
  const onError = (error) => { state.error = error }
  const onEnd = () => {
    if (state.eventIOP !== undefined) state.eventIOP.resolve()
    state.isEnd = true
  }
  const onReadable = () => {
    if (state.eventIOP !== undefined) state.eventIOP.resolve()
    state.isReadable = true
  }
  readableStream.on('error', onError)
  readableStream.on('end', onEnd)
  readableStream.on('readable', onReadable)
  const allOff = () => {
    readableStream.off('error', onError)
    readableStream.off('end', onEnd)
    readableStream.off('readable', onReadable)
  }
  return {
    ...extra, key, prevPoolKey: KEY_POOL_IO, prevPendKey: KEY_PEND_INPUT,
    state,
    process: async (pack, state, error) => {
      if (error) return allOff()
      if (__DEV__ && pack[ 1 ] !== SKIP) throw new Error(`unexpected input: ${[ ...pack, state, error ].map((v) => String(v)).join(', ')}`)
      if (state.error !== undefined) throw state.error

      if (state.isEnd === false && state.isReadable === false) { // need to wait for read
        if (state.eventIOP === undefined) state.eventIOP = createInsideOutPromise() // TODO: this process should not run in parallel, is this check needed?
        await state.eventIOP.promise
        state.eventIOP = undefined
      }
      if (state.isReadable === false && state.isEnd === true) { // check isEnd and isReadable so no value is missed
        allOff()
        pack[ 1 ] = END
      } else if (state.isReadable === true) {
        state.isReadable = false
        const chunkList = []
        let chunk
        while ((chunk = readableStream.read(readSize)) !== null) chunkList.push(chunk)
        pack[ 0 ] = chunkList.length === 1 ? chunkList[ 0 ] : Buffer.concat(chunkList)
        pack[ 1 ] = undefined
      }
      return { pack, state }
    }
  }
}

const createWritableStreamOutputChip = ({
  writableStream,
  IOP = createInsideOutPromise(),
  key = 'chip:output:stream-writable', ...extra
}) => {
  const state = {
    error: undefined,
    isDrain: true, eventIOP: undefined
  }
  const onError = (error) => { state.error = error }
  const onDrain = () => {
    if (state.eventIOP !== undefined) state.eventIOP.resolve()
    state.isDrain = true
  }
  writableStream.on('error', onError)
  writableStream.on('drain', onDrain)
  const allOff = () => {
    writableStream.off('error', onError)
    writableStream.off('drain', onDrain)
  }
  return {
    ...extra, key, nextPoolKey: KEY_POOL_IO, nextPendKey: KEY_PEND_OUTPUT,
    state,
    process: async (pack, state, error) => {
      if (error) {
        allOff()
        return IOP.reject(error)
      } else if (state.error !== undefined) throw state.error

      if (pack[ 1 ] === END) {
        await new Promise((resolve) => writableStream.end(resolve))
        allOff()
        IOP.resolve()
      } else {
        if (state.isDrain === false) { // need to wait for write
          state.eventIOP = createInsideOutPromise()
          await state.eventIOP.promise
          state.eventIOP = undefined
        }
        state.isDrain = writableStream.write(pack[ 0 ])
        pack[ 0 ] = undefined
        pack[ 1 ] = SKIP
      }
      return { pack, state }
    },
    promise: IOP.promise
  }
}

const createTransformStreamChip = ({
  transformStream, readSize,
  key = 'chip:stream-transform', ...extra
}) => {
  const state = {
    error: undefined,
    isDrain: true, isWriteEnd: false,
    isEnd: false, isReadable: false, eventIOP: undefined
  }
  const onError = (error) => { state.error = error }
  const onDrain = () => {
    if (state.eventIOP !== undefined) state.eventIOP.resolve()
    state.isDrain = true
  }
  const onEnd = () => {
    if (state.eventIOP !== undefined) state.eventIOP.resolve()
    state.isEnd = true
  }
  const onReadable = () => {
    if (state.eventIOP !== undefined) state.eventIOP.resolve()
    state.isReadable = true
  }
  transformStream.on('error', onError)
  transformStream.on('drain', onDrain)
  transformStream.on('end', onEnd)
  transformStream.on('readable', onReadable)
  const allOff = () => {
    transformStream.off('error', onError)
    transformStream.off('drain', onDrain)
    transformStream.off('end', onEnd)
    transformStream.off('readable', onReadable)
  }
  return {
    ...extra, key,
    state,
    process: async (pack, state, error) => {
      if (error) return allOff()
      if (state.error !== undefined) throw state.error
      // NOTE: to fit TransformStream into a Chip process, the strategy is to write as much as possible,
      //   then read as much while waiting for drain
      if (pack[ 1 ] === END && state.isWriteEnd === false) { // END
        state.isWriteEnd = true
        transformStream.end() // no more write
      }
      if ((state.isWriteEnd === true || state.isDrain === false) && state.isEnd === false && state.isReadable === false) { // need to wait for write/read
        if (state.eventIOP === undefined) state.eventIOP = createInsideOutPromise()
        await state.eventIOP.promise
        state.eventIOP = undefined
      }
      let needWriteREDO = true
      if (pack[ 1 ] !== END && state.isDrain === true) { // write
        state.isDrain = transformStream.write(pack[ 0 ])
        needWriteREDO = false
      }
      if (state.isReadable === false && state.isEnd === true) { // check isEnd and isReadable so no value is missed
        if (__DEV__ && state.isWriteEnd !== true) throw new Error('bad state.isWriteEnd')
        if (__DEV__ && pack[ 1 ] !== END) throw new Error('bad pack[ 1 ]')
        allOff()
      } else if (state.isReadable === true) {
        state.isReadable = false
        const chunkList = []
        let chunk
        while ((chunk = transformStream.read(readSize)) !== null) chunkList.push(chunk)
        const value = chunkList.length === 1 ? chunkList[ 0 ] : Buffer.concat(chunkList)
        if (needWriteREDO === true) pack = createPack(value, REDO)
        else {
          pack[ 0 ] = value
          pack[ 1 ] = undefined
        }
      } else { // just write but nothing to read yet
        if (__DEV__ && needWriteREDO === true) throw new Error('bad state needWriteREDO')
        pack[ 0 ] = undefined
        pack[ 1 ] = SKIP
      }
      return { pack, state }
    }
  }
}

export {
  isReadableStream, isWritableStream,
  setupStreamPipe,
  waitStreamStopAsync,
  bufferToReadableStream,
  readableStreamToBufferAsync,
  writeBufferToStreamAsync,
  readlineOfStreamAsync,

  // Runlet
  createReadableStreamInputChip,
  createWritableStreamOutputChip,
  createTransformStreamChip
}
