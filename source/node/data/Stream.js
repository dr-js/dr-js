import { Readable } from 'node:stream'
import { createInterface } from 'node:readline'

import { isBoolean, isObjectAlike, isBasicFunction } from 'source/common/check.js'
import { createInsideOutPromise } from 'source/common/function.js'
import {
  END, SKIP, REDO,
  createPack,
  createRunlet,
  createCountPool, KEY_POOL_IO, KEY_PEND_INPUT, KEY_PEND_OUTPUT, PoolIO,
  toPoolMap, toChipMap, toLinearChipList, quickConfigPend
} from 'source/common/module/Runlet.js'

// edited from: https://github.com/sindresorhus/is-stream
const isStream = (stream) => (
  isObjectAlike(stream) &&
  isBasicFunction(stream.pipe)
)
const isReadableStream = (stream) => (
  isStream(stream) &&
  isBoolean(stream.readable) &&
  isBasicFunction(stream._read)
)
const isStreamReadable = (stream) => (
  isReadableStream(stream) &&
  stream.readable !== false
)

const isWritableStream = (stream) => (
  isStream(stream) &&
  isBoolean(stream.writable) &&
  isBasicFunction(stream._write)
)
const isStreamWritable = (stream) => (
  isWritableStream(stream) &&
  stream.writable !== false
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
  if (streamList.length < 2) throw new Error('need at least 2 stream in streamList')
  if (!isStreamReadable(streamList[ 0 ])) throw new Error('first stream not readable') // TODO: for now close ReadableStream can setup pipe
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
  if (!isStream(stream)) reject(new Error('expect stream'))
  if (stream.destroyed) reject(new Error('stream already destroyed'))
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
  if (!isStreamReadable(readableStream)) reject(new Error('expect stream is readable'))
  const data = []
  readableStream.on('error', reject)
  readableStream.on('close', () => reject(new Error('unexpected stream close'))) // for close before end, should already resolved for normal close
  readableStream.on('end', () => resolve(Buffer.concat(data)))
  readableStream.on('data', (chunk) => data.push(chunk))
})

const writeBufferToStreamAsync = (writableStream, buffer) => new Promise((resolve, reject) => { // partially handled during write, will reset to not handled to allow reuse
  if (buffer.length === 0) return resolve() // for ServerResponse the callback will miss if the chunk is empty. https://nodejs.org/api/http.html#http_request_write_chunk_encoding_callback
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
  if (!isStreamReadable(readableStream)) reject(new Error('expect stream is readable'))
  const readlineInterface = createInterface({ input: readableStream, crlfDelay: Infinity })
  const doReject = (error) => {
    reject(error)
    readlineInterface.close()
  }
  readableStream.on('error', doReject)
  readlineInterface.on('error', doReject) // TODO: currently there's no 'error' event, check: https://github.com/nodejs/node/issues/30701
  readlineInterface.on('close', resolve)
  readlineInterface.on('line', (lineString) => {
    try {
      __DEV__ && console.log(`[Readline] line: ${lineString}`)
      onLineStringSync(lineString)
    } catch (error) { doReject(error) } // redirect error
  })
})

const createReadableStreamInputChip = ({
  stream, readSize, // default to 16K or 16, check: https://nodejs.org/api/stream.html#stream_new_stream_readable_options
  key = 'chip:input:stream-readable', ...extra
}) => {
  const state = {
    error: undefined,
    isEnd: false, isReadable: false, eventIOP: undefined
  }
  const onError = (error) => {
    state.error = error
    if (state.eventIOP !== undefined) state.eventIOP.reject(error)
  }
  const onEnd = () => {
    state.isEnd = true
    if (state.eventIOP !== undefined) state.eventIOP.resolve()
  }
  const onReadable = () => {
    state.isReadable = true
    if (state.eventIOP !== undefined) state.eventIOP.resolve()
  }
  stream.on('error', onError)
  stream.on('end', onEnd)
  stream.on('readable', onReadable)
  const allOff = () => {
    stream.off('error', onError)
    stream.off('end', onEnd)
    stream.off('readable', onReadable)
  }
  return {
    ...extra, key, prevPoolKey: KEY_POOL_IO, prevPendKey: KEY_PEND_INPUT,
    stream, // for manual `stream.destroyed || stream.destroy()` on error or detach
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
        while ((chunk = stream.read(readSize)) !== null) chunkList.push(chunk)
        pack[ 0 ] = chunkList.length === 1 ? chunkList[ 0 ] : Buffer.concat(chunkList)
        pack[ 1 ] = undefined
      }
      return { pack, state }
    }
  }
}

const createWritableStreamOutputChip = ({
  stream, keepOpen = [ process.stdout, process.stderr ].includes(stream), // false for stream except process.std*, similar to: https://nodejs.org/api/stream.html#stream_readable_pipe_destination_options
  IOP = createInsideOutPromise(),
  key = 'chip:output:stream-writable', ...extra
}) => {
  const state = {
    error: undefined,
    isFinish: false, isDrain: true, eventIOP: undefined
  }
  const onError = (error) => {
    state.error = error
    if (state.eventIOP !== undefined) state.eventIOP.reject(error)
  }
  const onFinish = () => {
    state.isFinish = true
    if (state.eventIOP !== undefined) state.eventIOP.resolve()
  }
  const onDrain = () => {
    state.isDrain = true
    if (state.eventIOP !== undefined) state.eventIOP.resolve()
  }
  stream.on('error', onError)
  stream.on('finish', onFinish)
  stream.on('drain', onDrain)
  const allOff = () => {
    stream.off('error', onError)
    stream.off('finish', onFinish)
    stream.off('drain', onDrain)
  }
  const waitIOP = async () => {
    state.eventIOP = createInsideOutPromise()
    await state.eventIOP.promise
    state.eventIOP = undefined
  }
  return {
    ...extra, key, nextPoolKey: KEY_POOL_IO, nextPendKey: KEY_PEND_OUTPUT,
    stream, // for manual `stream.destroyed || stream.destroy()` on error or detach
    state,
    process: async (pack, state, error) => {
      if (error) {
        allOff()
        return IOP.reject(error) // NOTE: return value is undefined
      } else if (state.error !== undefined) throw state.error

      if (pack[ 1 ] === END) {
        !keepOpen && stream.end() // end most stream by default
        while ((keepOpen ? state.isDrain : state.isFinish) === false) await waitIOP() // need to wait for write flush
        allOff()
        IOP.resolve()
      } else {
        if (state.isDrain === false) await waitIOP() // need to wait for write
        state.isDrain = stream.write(pack[ 0 ])
        pack[ 0 ] = undefined
        pack[ 1 ] = SKIP
      }
      return { pack, state }
    },
    promise: IOP.promise
  }
}

const createTransformStreamChip = ({
  stream, readSize,
  key = 'chip:stream-transform', ...extra
}) => {
  const state = {
    error: undefined,
    isDrain: true, isWriteEnd: false,
    isEnd: false, isReadable: false, eventIOP: undefined
  }
  const onError = (error) => {
    state.error = error
    if (state.eventIOP !== undefined) state.eventIOP.reject(error)
  }
  const onDrain = () => {
    state.isDrain = true
    if (state.eventIOP !== undefined) state.eventIOP.resolve()
  }
  const onEnd = () => {
    state.isEnd = true
    if (state.eventIOP !== undefined) state.eventIOP.resolve()
  }
  const onReadable = () => {
    state.isReadable = true
    if (state.eventIOP !== undefined) state.eventIOP.resolve()
  }
  stream.on('error', onError)
  stream.on('drain', onDrain)
  stream.on('end', onEnd)
  stream.on('readable', onReadable)
  const allOff = () => {
    stream.off('error', onError)
    stream.off('drain', onDrain)
    stream.off('end', onEnd)
    stream.off('readable', onReadable)
  }
  return {
    ...extra, key,
    stream, // for manual `stream.destroyed || stream.destroy()` on error or detach
    state,
    process: async (pack, state, error) => {
      if (error) return allOff()
      if (state.error !== undefined) throw state.error
      // NOTE: to fit TransformStream into a Chip process, the strategy is to write as much as possible,
      //   then read as much while waiting for drain
      if (pack[ 1 ] === END && state.isWriteEnd === false) { // END
        state.isWriteEnd = true
        stream.end() // no more write // NOTE: no write flush await here since still need to read all remain data
      }
      if ((state.isWriteEnd === true || state.isDrain === false) && state.isEnd === false && state.isReadable === false) { // need to wait for write/read
        if (state.eventIOP === undefined) state.eventIOP = createInsideOutPromise()
        await state.eventIOP.promise
        state.eventIOP = undefined
      }
      let needWriteREDO = true
      if (pack[ 1 ] !== END && state.isDrain === true) { // write
        state.isDrain = stream.write(pack[ 0 ])
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
        while ((chunk = stream.read(readSize)) !== null) chunkList.push(chunk)
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

// NOTE: designed to replace `waitStreamStopAsync(setupStreamPipe(...streamList))`
const quickRunletFromStream = (...streamList) => { // should be `readable-transform-...-transform-writable`
  if (streamList.length < 2) throw new Error('need at least 2 stream in streamList')
  const readableStream = streamList.shift()
  const writableStream = streamList.pop()
  const poolMap = toPoolMap([
    PoolIO,
    createCountPool({ sizeLimit: 8 })
  ])
  const chipMap = toChipMap(toLinearChipList([
    createReadableStreamInputChip({ stream: readableStream }),
    ...streamList.map((stream, index) => createTransformStreamChip({ stream, key: `chip:transform-${index}` })),
    createWritableStreamOutputChip({ key: 'out', stream: writableStream })
  ]))
  const { attach, trigger, describe } = createRunlet(quickConfigPend(poolMap, chipMap))
  attach()
  trigger()
  __DEV__ && console.log(describe().join('\n'))
  return chipMap.get('out').promise
}

export {
  isStream, isReadableStream, isStreamReadable, isWritableStream, isStreamWritable,
  setupStreamPipe,
  waitStreamStopAsync,
  bufferToReadableStream,
  readableStreamToBufferAsync,
  writeBufferToStreamAsync,
  readlineOfStreamAsync,

  // Runlet
  createReadableStreamInputChip,
  createWritableStreamOutputChip,
  createTransformStreamChip,
  quickRunletFromStream
}
