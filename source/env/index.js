import {
  getGlobal,
  getEnvironment,
  getSystemEndianness
} from './__utils__'

const global = getGlobal()
const { isNode, isBrowser, environmentName } = getEnvironment()
const systemEndianness = getSystemEndianness()

export {
  global,
  isNode,
  isBrowser,
  environmentName,
  systemEndianness
}

export {
  log,
  warn,
  error,
  assert
} from './function'
