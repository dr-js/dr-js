import nodeModulePath from 'path'
import { global } from 'source/env'

export { setProcessExitListener } from './ProcessExitListener'
export { getNetworkIPv4AddressList } from './NetworkAddress'
export { startREPL } from './REPL'

const PATH_NODE_EXE = global.process.argv[ 0 ]
const PATH_NODE_START_SCRIPT = nodeModulePath.resolve(global.process.cwd(), nodeModulePath.dirname(global.process.argv[ 1 ]))
const getLocalPath = (relativePath) => nodeModulePath.resolve(PATH_NODE_START_SCRIPT, relativePath)

export { PATH_NODE_EXE, PATH_NODE_START_SCRIPT, getLocalPath }
