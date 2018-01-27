import nodeModulePath from 'path'

export { setProcessExitListener } from './ProcessExitListener'
export { getNetworkIPv4AddressList } from './NetworkAddress'
export { startREPL } from './REPL'

const PATH_NODE_EXE = process.argv[ 0 ]
const PATH_NODE_START_SCRIPT = nodeModulePath.resolve(process.cwd(), nodeModulePath.dirname(process.argv[ 1 ] || ''))
const getLocalPath = (relativePath) => nodeModulePath.resolve(PATH_NODE_START_SCRIPT, relativePath)

// open Path or File with System Default
const DEFAULT_OPEN_MAP = {
  linux: 'xdg-open',
  win32: 'start',
  darwin: 'open'
}
const getDefaultOpen = () => {
  const defaultOpen = DEFAULT_OPEN_MAP[ process.platform ]
  if (!defaultOpen) throw new Error(`[getDefaultOpen] unsupported platform: ${process.platform}`)
  return defaultOpen
}

export { PATH_NODE_EXE, PATH_NODE_START_SCRIPT, getLocalPath, getDefaultOpen }
