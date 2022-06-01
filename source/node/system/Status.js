import {
  arch, platform, release,
  hostname, cpus, networkInterfaces,
  totalmem, freemem, loadavg, uptime
} from 'node:os'
import { getHeapStatistics } from 'node:v8'

import { percent, time, binary } from 'source/common/format.js'
import { indentLine, indentList } from 'source/common/string.js'

import { readTextSync } from 'source/node/fs/File.js'

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

const getSystemMemory = () => {
  try {
    if (platform() === 'linux') {
      // ~$ cat /proc/meminfo
      // MemTotal:        9170456 kB
      // MemFree:          325068 kB
      // MemAvailable:    2137580 kB // use this as it's more in line with the common "free" concept
      // ...
      // SwapTotal:       2097152 kB
      // SwapFree:        2048256 kB
      // ...
      const stringMemInfo = readTextSync('/proc/meminfo')
      const toByte = (regexp) => parseInt(regexp.exec(stringMemInfo)[ 1 ]) * 1024
      return {
        total: toByte(/MemTotal:\s+(\d+)/),
        free: toByte(/MemAvailable:\s+(\d+)/), // contains cache + free // NOTE: not all dist report `MemAvailable`, some only have `MemFree`
        swapTotal: toByte(/SwapTotal:\s+(\d+)/), // `SwapTotal` may be 0, check before divide
        swapFree: toByte(/SwapFree:\s+(\d+)/)
      }
    }
  } catch (error) { __DEV__ && console.log('[getSystemMemory]', error) }
  return { // this will not include swap, and free means fully unused, so cached memory is not counted
    total: totalmem(), // in bytes
    free: freemem(), // in bytes
    swapTotal: 0,
    swapFree: 0
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

const getSystemInfo = () => {
  const toGiB = (byte) => Math.round(byte / (2 ** 30))
  const toPercent = (total, free) => total ? `${(100 * (1 - free / total)).toFixed(0)}%` : '-'

  const { total, free, swapTotal, swapFree } = getSystemMemory()
  const nCPU = cpus().length
  const nMEM = toGiB(total)
  const nSWAP = toGiB(swapTotal)
  const loadAvgList = loadavg() // 1, 5, and 15 minute load averages

  const systemStatus = [ // single line for logging
    !swapTotal
      ? `[${nCPU}CPU|${nMEM}G]`
      : `[${nCPU}CPU|${nMEM}+${nSWAP}G]`,
    !swapTotal
      ? `mem=${toPercent(total, free)}`
      : `mem/swap=${toPercent(total, free)}/${toPercent(swapTotal, swapFree)}`,
    `loadavg=${loadAvgList.map((v) => v.toFixed(1)).join('|')}`,
    `uptime=${time(uptime() * 1000)}`
  ].join(' ')

  const [ load1Min, load5Min, load15Min ] = loadAvgList
  const loadStatus = (load15Min > nCPU * 1.1 && load5Min > nCPU * 0.7 && load1Min > nCPU * 0.7) ? '15MIN' // stress
    : (load5Min > nCPU * 1.3 && load1Min > nCPU * 0.7) ? '5MIN' // stress
      : (load5Min > nCPU * 0.7 && load1Min > nCPU * 1.7) ? '1MIN' // spike
        : ''

  return {
    nCPU, nMEM, nSWAP,
    systemStatus,
    loadStatus
  }
}

// NOTE: reserved space in heap that cannot be used to save JS data,
//   48MiB for device with >=2GiB mem,
//   24MiB for device with <2GiB mem
// the value comes from test code like:
//   node --max-old-space-size=8 -p "v8.getHeapStatistics().heap_size_limit / 1024 / 1024 - 8"
//   node --max-old-space-size=64 -p "v8.getHeapStatistics().heap_size_limit / 1024 / 1024 - 64"
//   node --max-old-space-size=512 -p "v8.getHeapStatistics().heap_size_limit / 1024 / 1024 - 512"
const V8_HEAP_RESERVED_SIZE = (totalmem() < 2 * 1024 * 1024 * 1024 ? 24 : 48) * 1024 * 1024

const getV8HeapStatus = () => {
  const { // https://nodejs.org/api/v8.html#v8getheapcodestatistics
    used_heap_size: v8HeapUsed, // similar to MemUsed
    heap_size_limit: v8HeapMax // similar to MemTotal
  } = getHeapStatistics() // NOTE: `total_available_size + used_heap_size` of then don't match `heap_size_limit`, but should be close (±1MiB)
  const total = v8HeapMax - V8_HEAP_RESERVED_SIZE
  const free = Math.max(total - v8HeapUsed, 0)
  return { total, free }
}

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

  getSystemInfo,

  V8_HEAP_RESERVED_SIZE, getV8HeapStatus
}
