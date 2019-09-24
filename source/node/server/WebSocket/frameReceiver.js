import { BUFFER_MAX_LENGTH, applyMaskQuadletBufferInPlace } from './function'

const NULL_ERROR = (error) => { __DEV__ && error && console.log('[NULL_ERROR] get error', error) }

const createFrameReceiverStore = (frameLengthLimit) => {
  let promiseTail = Promise.resolve('HEAD') // used to coordinate send and receive
  let doClearSocketListener = null
  return {
    dispose: () => {
      promiseTail.then(NULL_ERROR, NULL_ERROR)
      promiseTail = null
      doClearSocketListener && doClearSocketListener()
      doClearSocketListener = null
    },
    queuePromise: (resolve, reject) => (promiseTail = promiseTail.then(resolve, reject)),
    setClearSocketListener: (nextDoClearSocketListener) => { doClearSocketListener = nextDoClearSocketListener },
    frameDecoder: createFrameDecoder(frameLengthLimit),
    frameLengthLimit
  }
}

const listenAndReceiveFrame = (frameReceiverStore, socket, onFrame, onError = frameReceiverStore.dispose) => {
  let receiveResolve = null
  let receiveReject = null

  const reset = () => {
    __DEV__ && console.log('[Frame] reset')
    receiveReject && socket.off('error', receiveReject)
    receiveResolve = null
    receiveReject = null
    frameReceiverStore.frameDecoder.resetDecode()
  }

  const onPromiseReject = (error) => {
    reset()
    onError(error)
  }

  const promiseReceive = () => {
    __DEV__ && console.log('[Frame] promiseReceive first chunk')
    const receivePromise = new Promise((resolve, reject) => { // HACK: first pick out resolve to delay Promise resolve
      receiveResolve = resolve
      receiveReject = reject
    })
    socket.on('error', receiveReject)
    frameReceiverStore.queuePromise(() => receivePromise.then(onFrame), onPromiseReject)
  }

  const onSocketData = (chunk) => {
    __DEV__ && console.log(`[Frame] onSocketData +${chunk.length}`)
    frameReceiverStore.frameDecoder.pushBufferFrag(chunk)
    while (true) {
      receiveResolve === null && promiseReceive()
      const hasMore = frameReceiverStore.frameDecoder.decode()
      if (!hasMore) break // wait for more data
      const frame = frameReceiverStore.frameDecoder.tryGetDecodedFrame()
      if (frame === undefined) continue // wait for more data
      __DEV__ && console.log('[Frame] onSocketData got one frame', frame)
      receiveResolve(frame)
      reset()
    }
  }

  socket.on('data', onSocketData)
  frameReceiverStore.setClearSocketListener(() => {
    socket.off('data', onSocketData)
    reset()
  })
}

const DECODE_STAGE_INITIAL_OCTET = 0
const DECODE_STAGE_EXTEND_DATA_LENGTH_2 = 1
const DECODE_STAGE_EXTEND_DATA_LENGTH_8 = 2
const DECODE_STAGE_MASK_QUADLET = 3
const DECODE_STAGE_DATA_BUFFER = 4
const DECODE_STAGE_END_FRAME = 5

const createFrameDecoder = (frameLengthLimit) => {
  const { pushBufferFrag, tryShiftMergedBuffer } = createBufferPool()

  let mergedBuffer = null

  let stage = DECODE_STAGE_INITIAL_OCTET

  let decodedIsMask = false
  let decodedMaskQuadletBuffer = null

  let decodedIsFIN = false
  let decodedDataType = null
  let decodedDataBuffer = null
  let decodedDataBufferLength = 0

  const decode = () => {
    __DEV__ && console.log('decode', { stage })
    switch (stage) {
      case DECODE_STAGE_INITIAL_OCTET:
        if ((mergedBuffer = tryShiftMergedBuffer(2))) {
          const initialQuadlet = mergedBuffer.readUInt16BE(0, !__DEV__)
          const quadbitFIN = (initialQuadlet >>> 12) & 0b1000
          const quadbitOpcode = (initialQuadlet >>> 8) & 0b1111
          const initialLength = initialQuadlet & 0b01111111

          decodedIsMask = ((initialQuadlet & 0b10000000) !== 0)
          decodedIsFIN = (quadbitFIN === 0b1000)
          decodedDataType = quadbitOpcode

          if (initialLength === 0) {
            decodedDataBufferLength = 0
            stage = decodedIsMask ? DECODE_STAGE_MASK_QUADLET : DECODE_STAGE_END_FRAME // complete, a 16bit frame
          } else if (initialLength <= 125) {
            decodedDataBufferLength = initialLength
            if (decodedDataBufferLength > frameLengthLimit) throw new Error(`dataBuffer length ${decodedDataBufferLength} exceeds limit: ${frameLengthLimit}`)
            stage = decodedIsMask ? DECODE_STAGE_MASK_QUADLET : DECODE_STAGE_DATA_BUFFER
          } else if (initialLength === 126) stage = DECODE_STAGE_EXTEND_DATA_LENGTH_2
          else stage = DECODE_STAGE_EXTEND_DATA_LENGTH_8

          // __DEV__ && console.log('[DECODE_STAGE_INITIAL_OCTET]', { quadbitFIN, quadbitOpcode, initialLength })
          return true
        }
        break
      case DECODE_STAGE_EXTEND_DATA_LENGTH_2:
        if ((mergedBuffer = tryShiftMergedBuffer(2))) {
          decodedDataBufferLength = mergedBuffer.readUInt16BE(0, !__DEV__)
          if (decodedDataBufferLength > frameLengthLimit) throw new Error(`dataBuffer length ${decodedDataBufferLength} exceeds limit: ${frameLengthLimit}`)
          stage = decodedIsMask ? DECODE_STAGE_MASK_QUADLET : DECODE_STAGE_DATA_BUFFER

          // __DEV__ && console.log('[DECODE_STAGE_EXTEND_DATA_LENGTH_2]', { decodedDataBufferLength })
          return true
        }
        break
      case DECODE_STAGE_EXTEND_DATA_LENGTH_8:
        if ((mergedBuffer = tryShiftMergedBuffer(8))) {
          decodedDataBufferLength = mergedBuffer.readUInt32BE(0, !__DEV__) * 0x100000000 + mergedBuffer.readUInt32BE(4, !__DEV__)
          if (decodedDataBufferLength > BUFFER_MAX_LENGTH) throw new Error('decodedDataBufferLength too big')
          if (decodedDataBufferLength > frameLengthLimit) throw new Error(`dataBuffer length ${decodedDataBufferLength} exceeds limit: ${frameLengthLimit}`)
          stage = decodedIsMask ? DECODE_STAGE_MASK_QUADLET : DECODE_STAGE_DATA_BUFFER

          // __DEV__ && console.log('[DECODE_STAGE_EXTEND_DATA_LENGTH_8]', { decodedDataBufferLength })
          return true
        }
        break
      case DECODE_STAGE_MASK_QUADLET:
        if ((mergedBuffer = tryShiftMergedBuffer(4))) {
          decodedMaskQuadletBuffer = mergedBuffer
          stage = decodedDataBufferLength ? DECODE_STAGE_DATA_BUFFER : DECODE_STAGE_END_FRAME

          // __DEV__ && console.log('[DECODE_STAGE_MASK_QUADLET]', { decodedMaskQuadletBuffer })
          return true
        }
        break
      case DECODE_STAGE_DATA_BUFFER:
        if ((mergedBuffer = tryShiftMergedBuffer(decodedDataBufferLength))) {
          decodedDataBuffer = mergedBuffer
          decodedIsMask && applyMaskQuadletBufferInPlace(decodedDataBuffer, decodedMaskQuadletBuffer)
          stage = DECODE_STAGE_END_FRAME

          // __DEV__ && console.log('[DECODE_STAGE_DATA_BUFFER]', { decodedDataBuffer }, String(decodedDataBuffer))
          return true
        }
        break
    }
    return false // no parse-able buffer
  }

  const resetDecode = () => {
    stage = DECODE_STAGE_INITIAL_OCTET

    decodedIsMask = false
    decodedMaskQuadletBuffer = null

    decodedIsFIN = false
    decodedDataType = null
    decodedDataBuffer = null
    decodedDataBufferLength = 0
  }

  const tryGetDecodedFrame = () => stage !== DECODE_STAGE_END_FRAME
    ? undefined
    : {
      isFIN: decodedIsFIN,
      dataType: decodedDataType,
      dataBuffer: decodedDataBuffer,
      dataBufferLength: decodedDataBufferLength
    }

  return {
    pushBufferFrag,
    decode,
    resetDecode,
    tryGetDecodedFrame
  }
}

const createBufferPool = () => { // push smaller buffer frag, shift whole merged buffer
  const pool = []
  let poolSumLength = 0

  const pushBufferFrag = (bufferFrag) => {
    pool.push(bufferFrag)
    poolSumLength += bufferFrag.length
  }

  const tryShiftMergedBuffer = (length) => {
    if (poolSumLength < length) return // not enough yet

    poolSumLength -= length

    if (length === pool[ 0 ].length) { // frag size just fit
      return pool.shift()
    }

    if (length < pool[ 0 ].length) { // frag bigger than merged buffer
      const buffer = pool[ 0 ].slice(0, length)
      pool[ 0 ] = pool[ 0 ].slice(length)
      return buffer
    }

    { // merge multiple frag
      const buffer = Buffer.allocUnsafe(length)
      let offset = 0
      while (length > 0) {
        const frag = pool[ 0 ]
        const fragLength = frag.length
        if (length >= fragLength) { // add frag
          frag.copy(buffer, offset)
          pool.shift()
          offset += fragLength
          length -= fragLength
        } else { // add part of frag
          frag.copy(buffer, offset, 0, length)
          pool[ 0 ] = frag.slice(length)
          length = 0
        }
      }
      return buffer
    }
  }

  return {
    pushBufferFrag,
    tryShiftMergedBuffer
  }
}

export {
  createFrameReceiverStore,
  listenAndReceiveFrame
}
