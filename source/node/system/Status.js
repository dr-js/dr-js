import {
  arch, platform, release,
  hostname, cpus, networkInterfaces,
  totalmem, freemem, loadavg, uptime
} from 'os'

import { percent, time, binary, stringIndentLine } from 'source/common/format'
import { tryCall } from 'source/common/error'

const getSystemPlatform = () => ({
  platform: platform(),
  arch: arch(),
  release: release()
})
const describeSystemPlatform = ({ platform, arch, release } = getSystemPlatform()) => `${platform} ${arch} [${release}]`

// TODO: cpus() will return undefined on Android 8 Termux
const getSystemProcessor = () => cpus() || [ { model: 'N/A', speed: 'N/A', times: {} } ]
const describeSystemProcessor = (processorList = getSystemProcessor()) => processorList
  .map(({ model, speed, times }) => `[${model}] speed:${speed}MHz ${Object.entries(times).map(([ k, v ]) => `${k}:${time(v)}`).join(' ')}`)
  .join('\n')

const getSystemMemory = () => ({
  total: totalmem(),
  free: freemem()
})
const describeSystemMemory = ({ total, free } = getSystemMemory()) => [
  `Used: ${percent((total - free) / total)}`,
  `Total: ${binary(total)}B`,
  `Free: ${binary(free)}B`
].join('\n')

const getSystemNetwork = () => ({
  hostname: hostname(),
  networkInterface: networkInterfaces()
})
const describeSystemNetwork = ({ hostname, networkInterface } = getSystemNetwork()) => [
  `[hostname] ${hostname}`,
  `[interface]`,
  ...Object.entries(networkInterface).reduce((o, [ name, addressList ]) => {
    o.push(`  ${name}`)
    return o.concat(addressList.map(({ address, netmask, mac, internal, family, cidr }) => `   - [${family}${internal ? '|INTERNAL' : ''}] ${cidr || address} (${mac})`))
  }, [])
].join('\n')

const getSystemActivity = () => ({
  uptime: uptime() * 1000,
  loadAverageList: loadavg()
})
const describeSystemActivity = ({ uptime, loadAverageList } = getSystemActivity()) => [
  `[uptime] ${time(uptime)}`,
  platform() !== 'win32' && `[load average] ${loadAverageList.map(percent).join(', ')} (1min, 5min, 15min)`
].filter(Boolean).join('\n')

const getSystemStatus = () => ({
  platform: getSystemPlatform(),
  processor: getSystemProcessor(),
  memory: getSystemMemory(),
  network: getSystemNetwork(),
  activity: getSystemActivity()
})

const describeSystemStatus = () => Object.entries({
  Platform: describeSystemPlatform(),
  Processor: describeSystemProcessor(),
  Memory: describeSystemMemory(),
  Network: describeSystemNetwork(),
  Activity: describeSystemActivity()
}).map(([ k, v ]) => `[${k}]\n${stringIndentLine(v)}`).join('\n')

const getProcessStatus = () => ({
  title: process.title,
  pid: process.pid,
  ppid: process.ppid,

  uid: tryCall(process, 'getuid'),
  gid: tryCall(process, 'getgid'),
  groups: tryCall(process, 'getgroups') || [],
  euid: tryCall(process, 'geteuid'),
  egid: tryCall(process, 'getegid'),

  stdio: {
    stdin: getStdio('stdin'),
    stdout: getStdio('stdout'),
    stderr: getStdio('stderr')
  },
  isConnectedIPC: Boolean(process.connected),

  execPath: process.execPath,
  execArgv: process.execArgv, // []
  argv: process.argv, // []
  cwd: process.cwd(),
  uptime: process.uptime() * 1000,
  cpuUsage: process.cpuUsage(), // {}
  memoryUsage: process.memoryUsage() // {}
})

const getStdio = (name) => ({ isTTY: Boolean(process[ name ].isTTY) })

export {
  getSystemPlatform,
  getSystemProcessor,
  getSystemMemory,
  getSystemNetwork,
  getSystemActivity,
  getSystemStatus,

  describeSystemPlatform,
  describeSystemProcessor,
  describeSystemMemory,
  describeSystemNetwork,
  describeSystemActivity,
  describeSystemStatus,

  getProcessStatus
}
