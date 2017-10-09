const EMPTY_FUNC = () => {}

const PROCESS_EXIT_SIGNAL_EVENT_TYPE_LIST = [
  'SIGINT', // 1, soft
  'SIGHUP', // 2, soft, ~10sec kill delay in Windows
  'SIGQUIT', // 3, soft
  // 'SIGKILL', // 9, hard, cannot have a listener installed
  'SIGTERM' // 15, soft
]

let wrappedListenerList = [
  // { eventType, wrappedListener }
]

const clearProcessExitListener = () => {
  wrappedListenerList.forEach(({ eventType, wrappedListener }) => process.removeListener(eventType, wrappedListener))
  wrappedListenerList = []
}

// TODO: this does not provide a way to prevent soft exit
const setProcessExitListener = ({ listenerAsync = EMPTY_FUNC, listenerSync = EMPTY_FUNC }) => {
  if (wrappedListenerList.length) throw new Error('[ProcessExitListener] listener already set')

  const wrappedListenerAsync = async (event) => {
    clearProcessExitListener()
    const code = await listenerAsync(event) || 0
    listenerSync({ eventType: 'exit', code })
    process.exit(code)
  }

  wrappedListenerList = [
    { eventType: 'exit', wrappedListener: (code) => listenerSync({ eventType: 'exit', code }) }, // sync only
    { eventType: 'uncaughtException', wrappedListener: (error) => wrappedListenerAsync({ eventType: 'uncaughtException', error }) },
    { eventType: 'unhandledRejection', wrappedListener: (error, promise) => wrappedListenerAsync({ eventType: 'unhandledRejection', error, promise }) },
    ...PROCESS_EXIT_SIGNAL_EVENT_TYPE_LIST.map((eventType) => ({
      eventType, wrappedListener: () => wrappedListenerAsync({ eventType: 'signal', signalEventType: eventType })
    }))
  ]

  wrappedListenerList.forEach(({ eventType, wrappedListener }) => process.on(eventType, wrappedListener))

  return clearProcessExitListener
}

export { setProcessExitListener }
