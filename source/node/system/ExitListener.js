import { catchAsync, catchSync } from 'source/common/error'

const EXIT_LISTENER_LIST = [
  // sync only
  { event: 'exit', listener: (code) => exitListenerSync({ eventType: 'exit', code }) },

  // async + sync
  { event: 'uncaughtException', listener: (error) => exitListenerAsync({ eventType: 'uncaughtException', error }) },
  { event: 'unhandledRejection', listener: (error, promise) => exitListenerAsync({ eventType: 'unhandledRejection', error, promise }) },
  ...[
    'SIGINT', // 1, soft
    'SIGHUP', // 2, soft, ~10sec kill delay in Windows
    'SIGQUIT', // 3, soft
    // 'SIGKILL', // 9, hard, cannot have a listener installed
    'SIGTERM' // 15, soft
  ].map((event) => ({ event, listener: () => exitListenerAsync({ eventType: 'signal', signalEventType: event }) }))
]

const listenerSyncSet = new Set()
const listenerAsyncSet = new Set()

const exitListenerSync = (event) => { for (const listenerSync of Array.from(listenerSyncSet)) catchSync(listenerSync, event) }
const exitListenerAsync = async (event) => {
  unbindExitListener()
  for (const listenerAsync of Array.from(listenerAsyncSet)) await catchAsync(listenerAsync, event)
  exitListenerSync(event)
  // TODO: NOTE: do not try prevent process exit, even if it can be done for some event
  process.exit(event.code || (event.error ? -1 : 0))
}

let isBind = false
const bindExitListener = () => {
  __DEV__ && console.log('[bindExitListener]')
  isBind = true
  EXIT_LISTENER_LIST.forEach(({ event, listener }) => process.on(event, listener))
}
const unbindExitListener = () => {
  __DEV__ && console.log('[unbindExitListener]')
  isBind = false
  EXIT_LISTENER_LIST.forEach(({ event, listener }) => process.removeListener(event, listener))
}

const clearExitListener = () => {
  __DEV__ && console.log('[clearExitListener]')
  listenerSyncSet.clear()
  listenerAsyncSet.clear()
  unbindExitListener()
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
