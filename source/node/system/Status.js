import {
  arch, platform, release,
  hostname, cpus, networkInterfaces,
  totalmem, freemem, loadavg, uptime
} from 'os'
import { readFileSync } from 'fs'

import { percent, time, binary } from 'source/common/format'
import { indentLine, indentList } from 'source/common/string'

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

const getSystemMemory = platform() !== 'linux' ? () => ({ // this will not include swap, and free means fully unused, so cached memory is not counted
  total: totalmem(), // in bytes
  free: freemem(), // in bytes
  swapTotal: 0,
  swapFree: 0
}) : () => {
  // ~$ cat /proc/meminfo
  // MemTotal:        9170456 kB
  // MemFree:          325068 kB
  // MemAvailable:    2137580 kB // use this as it's more in line with the common "free" concept
  // ...
  // SwapTotal:       2097152 kB
  // SwapFree:        2048256 kB
  // ...
  const stringMemInfo = String(readFileSync('/proc/meminfo'))
  const toByte = (regexp) => parseInt(regexp.exec(stringMemInfo)[ 1 ]) * 1024
  return {
    total: toByte(/MemTotal:\s+(\d+)/),
    free: toByte(/MemAvailable:\s+(\d+)/), // contains cache + free
    swapTotal: toByte(/SwapTotal:\s+(\d+)/), // SwapTotal may be 0, check before divide
    swapFree: toByte(/SwapFree:\s+(\d+)/)
  }
}
const describeSystemMemory = ({ total, free, swapTotal, swapFree } = getSystemMemory()) => [
  `Used: ${percent((total - free) / total)}${swapTotal ? `+${percent((swapTotal - swapFree) / swapTotal)}` : ''}`,
  `Total: ${binary(total)}B${swapTotal ? `+${binary(swapTotal)}B` : ''}`,
  `Free: ${binary(free)}B${swapTotal ? `+${binary(swapFree)}B` : ''}`
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
  describeSystemStatus
}
