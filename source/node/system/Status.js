import {
  arch, platform, release,
  hostname, cpus, networkInterfaces,
  totalmem, freemem, loadavg, uptime
} from 'os'

import { percent, time, binary } from 'source/common/format'
import { indentLine, indentList } from 'source/common/string'
import { tryCall } from 'source/common/error'

const getSystemPlatform = () => ({
  platform: platform(),
  arch: arch(),
  release: release()
})
const describeSystemPlatform = ({ platform, arch, release } = getSystemPlatform()) => `${platform} ${arch} [${release}]`

// TODO: cpus() will return undefined on Android 8+ Termux
const getSystemProcessor = () => cpus() || [ { model: 'N/A', speed: 'N/A', times: { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 } } ]
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
  ...Object.entries(networkInterface).map(([ name, addressList ]) => indentList(
    `[interface] ${name}`,
    addressList.map(({ address, netmask, mac, internal, family, cidr }) => `[${family}${internal ? '|INTERNAL' : ''}] ${cidr || address} (${mac})`)
  ))
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

const describeSystemStatus = ({ platform, processor, memory, network, activity } = getSystemStatus()) => Object.entries({
  platform: describeSystemPlatform(platform),
  processor: describeSystemProcessor(processor),
  memory: describeSystemMemory(memory),
  network: describeSystemNetwork(network),
  activity: describeSystemActivity(activity)
}).map(([ k, v ]) => `[${k}]\n${indentLine(v)}`).join('\n')

const getCurrentProcessStatus = () => ({ // status for current node process // TODO: use `process.resourceUsage()` from `node@12.6.0`
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
  cpuUsage: process.cpuUsage(), // { user, system } // in µsec(micro-sec), not msec(mili-sec)
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

  getCurrentProcessStatus
}
