import { catchAsync, catchSync } from 'source/common/error'

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
  // console.log('[exitListenerSync]', eventPack)
  isBind && unbindExitListener()
  for (const listenerSync of Array.from(listenerSyncSet)) catchSync(listenerSync, eventPack)

  process.exitCode = eventPack.code || (eventPack.error && 1) || 0 // TODO: change to set exitCode so clunky clean up can be detected
}
const exitListenerAsync = async (eventPack) => {
  // console.log('[exitListenerAsync]', eventPack)
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

const addExitListenerSync = (...args) => {
  args.forEach((listenerSync) => listenerSyncSet.add(listenerSync))
  !isBind && bindExitListener()
}
const addExitListenerAsync = (...args) => {
  args.forEach((listenerAsync) => listenerAsyncSet.add(listenerAsync))
  !isBind && bindExitListener()
}

const deleteExitListenerSync = (...args) => { args.forEach((listenerSync) => listenerSyncSet.delete(listenerSync)) }
const deleteExitListenerAsync = (...args) => { args.forEach((listenerAsync) => listenerAsyncSet.delete(listenerAsync)) }

export {
  clearExitListener,
  addExitListenerSync,
  addExitListenerAsync,
  deleteExitListenerSync,
  deleteExitListenerAsync
}
