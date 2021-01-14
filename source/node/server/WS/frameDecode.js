import { END, SKIP, REDO, createPack } from 'source/common/module/Runlet'
import { createBufferRefragPool } from 'source/node/data/Buffer'
import { OPCODE_TYPE, BUFFER_MAX_LENGTH, applyMaskQuadletBufferInPlace } from './function'

const DECODE_STAGE_INITIAL_OCTET = 0
const DECODE_STAGE_EXTEND_DATA_LENGTH_2 = 1
const DECODE_STAGE_EXTEND_DATA_LENGTH_8 = 2
const DECODE_STAGE_MASK_QUADLET = 3
const DECODE_STAGE_DATA_BUFFER = 4
const DECODE_STAGE_END_FRAME = 5

const createRawFrameData = () => ({
  isFIN: false, // for later concat multi-frame data
  opcode: 0,
  buffer: null
})

const createDecodeState = () => ({
  stage: DECODE_STAGE_INITIAL_OCTET,
  isMask: false, maskQuadletBuffer: null, dataLength: 0,
  rawFrameData: createRawFrameData()
})

const decodeRawFrame = ({ dataLengthLimit, refragPool, decodeState }) => {
  // __DEV__ && console.log('<< decode', { dataLengthLimit, decodeState })
  let mergedBuffer = null
  switch (decodeState.stage) {
    case DECODE_STAGE_INITIAL_OCTET:
      if ((mergedBuffer = refragPool.tryGetRefragBuffer(2))) {
        const initialQuadlet = mergedBuffer.readUInt16BE(0)
        const quadbitFIN = (initialQuadlet >>> 12) & 0b1000
        const quadbitOpcode = (initialQuadlet >>> 8) & 0b1111
        const initialLength = initialQuadlet & 0b01111111

        decodeState.isMask = ((initialQuadlet & 0b10000000) !== 0)
        decodeState.rawFrameData.isFIN = (quadbitFIN === 0b1000)
        decodeState.rawFrameData.opcode = quadbitOpcode

        if (initialLength === 0) {
          decodeState.dataLength = 0
          decodeState.stage = decodeState.isMask ? DECODE_STAGE_MASK_QUADLET : DECODE_STAGE_END_FRAME // complete, a 16bit frame
        } else if (initialLength <= 125) {
          decodeState.dataLength = initialLength
          if (decodeState.dataLength > dataLengthLimit) throw new Error(`dataLength ${decodeState.dataLength} exceeds limit: ${dataLengthLimit}`)
          decodeState.stage = decodeState.isMask ? DECODE_STAGE_MASK_QUADLET : DECODE_STAGE_DATA_BUFFER
        } else if (initialLength === 126) decodeState.stage = DECODE_STAGE_EXTEND_DATA_LENGTH_2
        else decodeState.stage = DECODE_STAGE_EXTEND_DATA_LENGTH_8
        return true
      }
      break
    case DECODE_STAGE_EXTEND_DATA_LENGTH_2:
      if ((mergedBuffer = refragPool.tryGetRefragBuffer(2))) {
        decodeState.dataLength = mergedBuffer.readUInt16BE(0)
        if (decodeState.dataLength > dataLengthLimit) throw new Error(`dataLength ${decodeState.dataLength} exceeds limit: ${dataLengthLimit}`)
        decodeState.stage = decodeState.isMask ? DECODE_STAGE_MASK_QUADLET : DECODE_STAGE_DATA_BUFFER
        return true
      }
      break
    case DECODE_STAGE_EXTEND_DATA_LENGTH_8:
      if ((mergedBuffer = refragPool.tryGetRefragBuffer(8))) {
        decodeState.dataLength = mergedBuffer.readUInt32BE(0) * 0x100000000 + mergedBuffer.readUInt32BE(4)
        if (decodeState.dataLength > BUFFER_MAX_LENGTH) throw new Error(`dataLength too big: ${decodeState.dataLength}`)
        if (decodeState.dataLength > dataLengthLimit) throw new Error(`dataLength ${decodeState.dataLength} exceeds limit: ${dataLengthLimit}`)
        decodeState.stage = decodeState.isMask ? DECODE_STAGE_MASK_QUADLET : DECODE_STAGE_DATA_BUFFER
        return true
      }
      break
    case DECODE_STAGE_MASK_QUADLET:
      if ((mergedBuffer = refragPool.tryGetRefragBuffer(4))) {
        decodeState.maskQuadletBuffer = mergedBuffer
        decodeState.stage = decodeState.dataLength ? DECODE_STAGE_DATA_BUFFER : DECODE_STAGE_END_FRAME
        return true
      }
      break
    case DECODE_STAGE_DATA_BUFFER:
      if ((mergedBuffer = refragPool.tryGetRefragBuffer(decodeState.dataLength))) {
        decodeState.isMask && applyMaskQuadletBufferInPlace(mergedBuffer, decodeState.maskQuadletBuffer)
        decodeState.rawFrameData.buffer = mergedBuffer
        decodeState.stage = DECODE_STAGE_END_FRAME
        return true
      }
      break
  }
  return false // no parse-able buffer yet
}

const tryPickRawFrameData = (state) => {
  if (state.decodeState.stage !== DECODE_STAGE_END_FRAME) return
  const { decodeState: { rawFrameData } } = state // get ref first
  state.decodeState = createDecodeState() // reset decode state
  return rawFrameData
}

const createFramePack = () => ({
  opcode: null,
  buffer: null,
  bufferList: [] // use above value, this will be cleared
})

const processRawFrameData = (state, rawFrameData) => {
  const { respondClose, respondPing, respondPong } = state // NOTE: here the async respond is treated as sync as it's all small frames
  const { isFIN, opcode, buffer } = rawFrameData
  switch (opcode) {
    case OPCODE_TYPE.CONTINUATION:
    case OPCODE_TYPE.TEXT:
    case OPCODE_TYPE.BINARY: {
      __DEV__ && console.log('DATA', { isFIN, opcode })
      const { framePack } = state
      if (framePack.bufferList.length === 0) framePack.opcode = opcode
      framePack.bufferList.push(buffer)
      // __DEV__ && console.log('[WS] data frame', isFIN ? 'complete' : 'need more', framePack.bufferList.length)
      if (isFIN) {
        // __DEV__ && console.log('[WS] emit one complete frame')
        framePack.buffer = framePack.bufferList.length === 1 ? framePack.bufferList[ 0 ] : Buffer.concat(framePack.bufferList)
        framePack.bufferList = undefined
        state.framePack = createFramePack()
        return framePack
      }
      break
    }
    case OPCODE_TYPE.CLOSE: {
      const code = (buffer.length >= 2 && buffer.readUInt16BE(0)) || 1000
      const reason = (buffer.length >= 3 && String(buffer.slice(2, buffer.length))) || ''
      __DEV__ && console.log('CLOSE', { code, reason })
      respondClose(code, reason)
      break
    }
    case OPCODE_TYPE.PING:
      __DEV__ && console.log('PING', buffer)
      respondPing(buffer)
      break
    case OPCODE_TYPE.PONG:
      __DEV__ && console.log('PONG')
      respondPong(buffer)
      break
    default:
      throw new Error(`invalid opcode: ${opcode}`)
  }
}

const createFrameDecodeChip = ({ // decode binary from socket to framePack object, only data framePack is passed down
  respondFrame, respondClose, respondPing, respondPong,
  dataLengthLimit = 16 * 1024 * 1024, // limit to 16MiB
  key = 'chip:frame-decode', ...extra // all the extra Pool/Pend config
}) => ({
  ...extra, key,
  state: {
    respondFrame, respondClose, respondPing, respondPong,
    dataLengthLimit,

    rawFrameDataList: [],
    refragPool: createBufferRefragPool(),
    decodeState: createDecodeState(),

    framePackList: [],
    framePack: createFramePack()
  },
  sync: true, process: (pack, state, error) => {
    if (error) return

    // decode buffer
    pack[ 0 ] !== undefined && state.refragPool.pushFrag(pack[ 0 ])
    while (decodeRawFrame(state) === true) { // decode till more data is required
      const rawFrameData = tryPickRawFrameData(state)
      // __DEV__ && rawFrameData !== undefined && console.log('[Frame] rawFrameData', rawFrameData)
      rawFrameData !== undefined && state.rawFrameDataList.push(rawFrameData)
    }

    // process raw frame
    while (state.rawFrameDataList.length !== 0) {
      const framePack = processRawFrameData(state, state.rawFrameDataList.shift())
      // __DEV__ && framePack !== undefined && console.log('[Frame] framePack', framePack)
      framePack !== undefined && state.framePackList.push(framePack)
    }

    if (state.framePackList.length === 0) {
      if (pack[ 1 ] !== END) pack = createPack(undefined, SKIP)
    } else if (state.framePackList.length >= 2 || pack[ 1 ] === END) {
      pack[ 0 ] = undefined // NOTE: clear current pack so REDO do not `pushFrag` again
      pack = createPack(state.framePackList.shift(), REDO)
    } else pack[ 0 ] = state.framePackList.shift() // reuse

    return { pack, state }
  }
})

export { createFrameDecodeChip }
