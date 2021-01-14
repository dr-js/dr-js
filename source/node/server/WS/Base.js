import { createInsideOutPromise } from 'source/common/function'
import { setWeakTimeout } from 'source/common/time'
import { wrapAsync, createLockStepAsyncIter } from 'source/common/data/Iter'
import { createAsyncFuncQueue } from 'source/common/module/AsyncFuncQueue.js'
import {
  createRunlet,
  createCountPool, PoolIO,
  toPoolMap, toChipMap, toLinearChipList, quickConfigPend
} from 'source/common/module/Runlet'
import { createAsyncIterInputChip, createAsyncIterOutputChip } from 'source/common/module/RunletChip'
import { createReadableStreamInputChip, createWritableStreamOutputChip } from 'source/node/data/Stream'

import { createFrameDecodeChip } from './frameDecode'
import { createFrameEncodeChip, encodeTextFramePack, encodeBinaryFramePack, createCloseFramePack, encodePingFramePack, encodePongFramePack } from './frameEncode'

const WS_PING_PONG_TIMEOUT = __DEV__ ? 5 * 1000 : 60 * 1000 // in msec, 60sec
const WS_CLOSE_TIMEOUT = __DEV__ ? 0.5 * 1000 : 5 * 1000 // in msec, 5sec

const DEFAULT_DATA_LENGTH_LIMIT = 8 * 1024 * 1024 // 8 MiB
const DEFAULT_BUFFER = Buffer.from('Dr')

const CONNECTING = 0 // The connection is not yet open.
const OPEN = 1 // The connection is open and ready to communicate.
const CLOSING = 2 // The connection is in the process of closing.
const CLOSED = 3 // The connection is closed or couldn't be opened.

const createWSBase = ({
  socket, // TCP
  info = {}, // { isSecure, protocol, protocolList, headers, ... } // plus `url` for client
  dataLengthLimit = DEFAULT_DATA_LENGTH_LIMIT,
  isMask = false, // default for client to server, to prevent proxy mistaken binary data as http or other protocol
  shouldPing = false // default for server to active ping client
}) => {
  let readyState = CONNECTING // will be set to OPEN very soon // TODO: NOTE: not spec, browser WebSocket can directly read readyState

  const closeClear = async (error) => {
    __DEV__ && console.log('[WS|closeClear]', { isMask, isCloseReceived, readyState, error })
    if (readyState === CLOSED) return
    readyState = CLOSED
    Object.assign(info, { error }) // NOTE: for outer code to get first error

    closeTimeoutToken && clearTimeout(closeTimeoutToken)
    pingCheckTimeoutToken && clearTimeout(pingCheckTimeoutToken)

    if (runletRead.getIsValid()) { // mute read
      LSAIRead.abort() // should not error
      runletRead.detach()
    }

    if (runletWrite.getIsValid()) { // wait write finish
      await pushLSAI(undefined, true) // use push to wait unsent frame
      await promise
      runletWrite.detach()
    }

    socket.destroy() // drop TCP, if still open
  }

  let isCloseReceived = false
  let closeTimeoutToken = null
  const close = async (code = 1000, reason = '') => {
    __DEV__ && console.log('[WS|close]', { isMask, isCloseReceived, readyState, code, reason })
    if (readyState === CLOSED || readyState === CLOSING) return closeClear() // sent close frame, directly closeClear, readyState is CLOSING
    if (readyState !== OPEN) throw new Error(`invalid readyState on close: ${readyState}`)
    readyState = CLOSING
    closeTimeoutToken = setWeakTimeout(closeClear, WS_CLOSE_TIMEOUT) // add close timeout
    __DEV__ && console.log('sendClose', { code, reason })
    return pushLSAI(createCloseFramePack(code, reason)).then( // send close ping, should wait for close pong then close TCP
      isCloseReceived ? closeClear : () => promise,
      closeClear // close faster on error
    )
  }
  const respondClose = async (code, reason) => { // TODO: outer code may expect non-1000 code to throw
    Object.assign(info, { code, reason }) // NOTE: for outer code to get returned code
    isCloseReceived = true
    return close(code, reason)
  }

  const sendText = async (string) => {
    if (readyState !== OPEN) throw new Error(`not open yet: readyState = ${readyState}`)
    __DEV__ && console.log('sendText', string.slice(0, 20))
    return pushLSAI(encodeTextFramePack(string))
  }
  const sendBinary = async (buffer) => {
    if (readyState !== OPEN) throw new Error(`not open yet: readyState = ${readyState}`)
    __DEV__ && console.log('sendBinary', buffer.length)
    return pushLSAI(encodeBinaryFramePack(buffer))
  }

  let pingBuffer = null
  let pongBuffer = null
  let pingCheckTimeoutToken = null
  const ping = async (buffer = DEFAULT_BUFFER) => {
    if (readyState !== OPEN || pingBuffer) return // skip dup-ping
    __DEV__ && console.log('ping', String(buffer))
    pingCheckTimeoutToken && clearTimeout(pingCheckTimeoutToken)
    pingCheckTimeoutToken = setWeakTimeout(pingCheck, WS_PING_PONG_TIMEOUT)
    pingBuffer = buffer
    pongBuffer = null
    return pushLSAI(encodePingFramePack(buffer))
  }
  const pingCheck = async () => {
    __DEV__ && console.log('pingCheck', {})
    if (!pongBuffer || Buffer.compare(pingBuffer, pongBuffer) !== 0) return close(1006, 'ping check failed')
    return shouldPing && ping()
  }
  const respondPing = async (buffer) => { // this is for other end's ping/pong, so no data record
    if (readyState !== OPEN) return
    __DEV__ && console.log('respondPing', String(buffer))
    return pushLSAI(encodePongFramePack(buffer))
  }
  const respondPong = (buffer) => {
    __DEV__ && console.log('respondPong', String(buffer))
    pongBuffer = buffer
  }

  const onError = (error) => runletWrite.getIsValid()
    ? close(1006, `error: ${__DEV__ ? error : error.message}`) // try send close
    : closeClear(error) // just close

  const LSAIRead = createLockStepAsyncIter()
  const LSAIWrite = createLockStepAsyncIter()
  const { push } = createAsyncFuncQueue()
  const pushLSAI = (framePack, done) => push(() => LSAIWrite.send(framePack, done)) // NOTE: queue up here to prevent LSAI `double-send`, and just bloat the queue to support event API usage

  const IOP = createInsideOutPromise()
  const promise = IOP.promise.catch(onError)

  // NOTE: use two Runlet so the error do not detach both side at once
  // TODO: allow outer code extend/reuse the Runlet
  const runletRead = createRunlet(quickConfigPend(
    toPoolMap([ PoolIO, createCountPool({ sizeLimit: 16 }) ]),
    toChipMap(toLinearChipList([ // read & decode
      createReadableStreamInputChip({ stream: socket }),
      createFrameDecodeChip({ respondClose, respondPing, respondPong, dataLengthLimit }),
      createAsyncIterOutputChip({ LSAI: LSAIRead })
    ])),
    { onError }
  ))
  const runletWrite = createRunlet(quickConfigPend(
    toPoolMap([ PoolIO, createCountPool({ sizeLimit: 16 }) ]),
    toChipMap(toLinearChipList([ // encode & write
      createAsyncIterInputChip({ next: LSAIWrite.next }),
      createFrameEncodeChip({ isMask, dataLengthLimit }),
      createWritableStreamOutputChip({ stream: socket, IOP })
    ])),
    { onError }
  ))

  readyState = OPEN
  runletRead.attach()
  runletWrite.attach()
  runletRead.trigger()
  runletWrite.trigger()
  shouldPing && ping()
  __DEV__ && console.log('[WS] open')

  return {
    ...wrapAsync(LSAIRead.next), // as AsyncIter
    promise, // write close promise, resolve only
    CONNECTING, OPEN, CLOSING, CLOSED,
    socket, info, dataLengthLimit, isMask, shouldPing,
    // getReadyState: () => readyState,
    getIsOpen: () => readyState === OPEN,

    close, closeClear, sendText, sendBinary, ping // NOTE: normally all these should use with await, but for convenience & event based usage support, the unsent data is queued up
  }
}

export { createWSBase }
