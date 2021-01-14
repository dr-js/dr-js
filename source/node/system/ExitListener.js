import { catchAsync, catchSync, catchPromise } from 'source/common/error'
import { once } from 'source/common/function'

__DEV__ && console.log({
  listenerFunc: (eventPack) => { // can be async for `addExitListenerSync`
    console.log(`[EXIT] ${JSON.stringify(eventPack)}${eventPack.error ? ` ${eventPack.error.stack || eventPack.error}` : ''}`) // suggested log pattern
  }
})

const EXIT_LISTENER_LIST = [
  // [ eventName, listenerFunc ]

  // trigger sync only
  [ 'exit', (code) => exitListenerSync({ eventType: 'exit', code }) ],

  // trigger async & sync
  [ 'uncaughtException', (error) => exitListenerAsync({ eventType: 'uncaughtException', error }) ],
  [ 'unhandledRejection', (error, promise) => exitListenerAsync({ eventType: 'unhandledRejection', error, promise }) ],
  ...[
    'SIGINT', // 1, soft
    'SIGHUP', // 2, soft, ~10sec kill delay in Windows
    'SIGQUIT', // 3, soft
    // 'SIGKILL', // 9, hard, cannot have a listener installed
    'SIGTERM' // 15, soft
  ].map((eventName) => [ eventName, () => exitListenerAsync({ eventType: 'signal', signalEventType: eventName }) ])
]

// TODO: sort of global variable, may be wrap in a create func, but `process` is also global, not decided
const listenerSyncSet = new Set()
const listenerAsyncSet = new Set()

const exitListenerSync = (eventPack) => {
  __DEV__ && console.log('[exitListenerSync]', eventPack)
  isBind && unbindExitListener()
  for (const listenerSync of Array.from(listenerSyncSet)) catchSync(listenerSync, eventPack)

  process.exitCode = eventPack.code || (eventPack.error && 1) || 0 // TODO: change to set exitCode so clunky clean up can be detected
}
const exitListenerAsync = async (eventPack) => {
  __DEV__ && console.log('[exitListenerAsync]', eventPack)
  isBind && unbindExitListener()
  for (const listenerAsync of Array.from(listenerAsyncSet)) await catchAsync(listenerAsync, eventPack)
  exitListenerSync(eventPack)
}

let isBind = false
const bindExitListener = () => {
  __DEV__ && console.log('[bindExitListener]')
  isBind = true
  EXIT_LISTENER_LIST.forEach(([ eventName, listenerFunc ]) => process.on(eventName, listenerFunc))
}
const unbindExitListener = () => {
  __DEV__ && console.log('[unbindExitListener]')
  isBind = false
  EXIT_LISTENER_LIST.forEach(([ eventName, listenerFunc ]) => process.off(eventName, listenerFunc))
}

const clearExitListener = () => {
  __DEV__ && console.log('[clearExitListener]')
  isBind && unbindExitListener()
  listenerSyncSet.clear()
  listenerAsyncSet.clear()
}

const addExitListenerSync = (...listenerSyncList) => {
  listenerSyncList.forEach((listenerSync) => listenerSyncSet.add(listenerSync))
  !isBind && bindExitListener()
}
const addExitListenerAsync = (...listenerSyncList) => {
  listenerSyncList.forEach((listenerAsync) => listenerAsyncSet.add(listenerAsync))
  !isBind && bindExitListener()
}
const addExitListenerLossyOnce = (listener) => { // NOTE: lossy means a async listener will not work as intended on a sync exit
  const onceListener = once(listener)
  addExitListenerAsync(onceListener)
  addExitListenerSync(onceListener)
  return onceListener // for delete
}

const deleteExitListenerSync = (...listenerSyncList) => { listenerSyncList.forEach((listenerSync) => listenerSyncSet.delete(listenerSync)) }
const deleteExitListenerAsync = (...listenerSyncList) => { listenerSyncList.forEach((listenerAsync) => listenerAsyncSet.delete(listenerAsync)) }

const guardPromiseEarlyExit = async ( // TODO: this is tricky to test
  callback, // () => {}
  promise
) => {
  const earlyExitCheck = (code) => code === 0 && isTestRunning === true && callback()
  let isTestRunning = true
  process.on('exit', earlyExitCheck)
  const { result, error } = await catchPromise(promise)
  isTestRunning = false
  process.off('exit', earlyExitCheck)
  if (error) throw error
  return result
}

export {
  clearExitListener,
  addExitListenerSync, addExitListenerAsync, addExitListenerLossyOnce,
  deleteExitListenerSync, deleteExitListenerAsync,

  guardPromiseEarlyExit
}
