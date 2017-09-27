import nodeModulePath from 'path'
import nodeModuleREPL from 'repl'

import { global } from 'source/env'

const PATH_NODE_EXE = global.process.argv[ 0 ]

const PATH_NODE_START_SCRIPT = nodeModulePath.resolve(global.process.cwd(), nodeModulePath.dirname(global.process.argv[ 1 ]))

const getLocalPath = (relativePath) => nodeModulePath.resolve(PATH_NODE_START_SCRIPT, relativePath)

const PROCESS_EXIT_SIGNAL_EVENT_TYPE_LIST = [ 'SIGINT', 'SIGHUP', 'SIGQUIT', 'SIGTERM' ]

const setProcessExitListener = (listener) => { // should only call once
  const wrappedListenerList = [
    { eventType: 'exit', wrappedListener: (code) => listener({ eventType: 'exit', code }) },
    { eventType: 'uncaughtException', wrappedListener: (error) => listener({ eventType: 'uncaughtException', error }) },
    ...PROCESS_EXIT_SIGNAL_EVENT_TYPE_LIST.map((eventType) => ({
      eventType,
      wrappedListener: () => {
        listener({ eventType, signalEventType: eventType })
        process.exit()
      }
    }))
  ]
  wrappedListenerList.forEach(({ eventType, wrappedListener }) => process.on(eventType, wrappedListener))
  return () => wrappedListenerList.forEach(({ eventType, wrappedListener }) => process.removeListener(eventType, wrappedListener))
}

// TODO: remove in 0.3.0
const addProcessExitListener = (listener) => {
  console.warn('[Deprecated Name] use setProcessExitListener')
  return setProcessExitListener(listener)
}

const startREPL = () => nodeModuleREPL.start({
  prompt: '> ',
  input: global.process.stdin,
  output: global.process.stdout,
  useGlobal: true
})

export {
  PATH_NODE_EXE,
  PATH_NODE_START_SCRIPT,

  getLocalPath,
  setProcessExitListener,
  addProcessExitListener,
  startREPL
}
