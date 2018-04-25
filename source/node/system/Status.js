import {
  arch, platform, release,
  hostname, cpus, networkInterfaces,
  totalmem, freemem, loadavg, uptime
} from 'os'

import { percent, time, binary, stringIndentLine } from 'source/common/format'

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
  `[load average] ${loadAverageList.map(percent).join(', ')} (1min, 5min, 15min)`
].join('\n')

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

  getegid: tryGet(process, 'getegid', -1),
  geteuid: tryGet(process, 'geteuid', -1),
  getgid: tryGet(process, 'getgid', -1),
  getgroups: tryGet(process, 'getgroups', []),
  getuid: tryGet(process, 'getuid', -1),

  stdio: {
    stdin: describeStdio('stdin'),
    stdout: describeStdio('stdout'),
    stderr: describeStdio('stderr')
  },
  connected: Boolean(process.connected),

  execPath: process.execPath,
  execArgv: process.execArgv, // []
  argv: process.argv, // []
  cwd: process.cwd(),
  uptime: process.uptime() * 1000,
  cpuUsage: process.cpuUsage(), // {}
  memoryUsage: process.memoryUsage() // {}
})

const tryGet = (thisArg, name, defaultReturn) => {
  try { return thisArg[ name ]() } catch (error) {
    __DEV__ && console.log('[tryGet]', name)
    return defaultReturn
  }
}

const describeStdio = (name) => `${name}${process[ name ].isTTY ? ' [TTY]' : ''}`

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
