import { cpus } from 'os'
import { getSystemEndianness } from 'dr-js/module/env'
import { name as packageName, version as packageVersion } from '../package.json'

const getVersion = () => ({
  packageName,
  packageVersion,
  systemNodeVersion: process.version,
  systemPlatform: process.platform,
  systemCPUArchitecture: process.arch,
  systemCPUCoreCount: cpus().length,
  systemEndianness: getSystemEndianness
})

export { getVersion }
