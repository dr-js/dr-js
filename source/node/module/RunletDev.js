import { createInsideOutPromise } from 'source/common/function'
import {
  END, SKIP,
  KEY_POOL_IO, KEY_PEND_INPUT, KEY_PEND_OUTPUT
} from 'source/common/module/RunletDev'

const createReadableStreamInputChip = ({
  readableStream,
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
      if (error) return
      if (__DEV__ && pack[ 1 ] !== SKIP) throw new Error(`unexpected input: ${[ ...pack, state, error ].map((v) => String(v)).join(', ')}`)
      if (state.error !== undefined) {
        allOff()
        throw state.error
      }
      if (state.isEnd === false && state.isReadable === false) { // need to wait for value
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
        while ((chunk = readableStream.read()) !== null) chunkList.push(chunk)
        pack[ 0 ] = chunkList.length === 1 ? chunkList[ 0 ] : Buffer.concat(chunkList)
        pack[ 1 ] = undefined
      } else throw new Error('unexpected state')
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
    isDrain: true, drainIOP: undefined
  }
  const onError = (error) => { state.error = error }
  const onDrain = () => {
    if (state.drainIOP !== undefined) state.drainIOP.resolve()
    else state.isDrain = true
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
      if (error) return IOP.reject(error)
      if (state.error !== undefined) {
        allOff()
        throw state.error
      } else if (pack[ 1 ] === END) {
        await new Promise((resolve) => writableStream.end(resolve))
        allOff()
        IOP.resolve()
      } else {
        if (state.isDrain === false) { // need to wait for drain
          state.drainIOP = createInsideOutPromise()
          await state.drainIOP.promise
          state.drainIOP = undefined
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

export {
  createReadableStreamInputChip,
  createWritableStreamOutputChip
}
