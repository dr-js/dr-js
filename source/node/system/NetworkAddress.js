import { networkInterfaces } from 'os'

const getNetworkIPv4AddressList = () => Object.entries(networkInterfaces()).reduce((o, [ interfaceName, interfaceList ]) => {
  interfaceList.forEach((v) => { v.family === 'IPv4' && v.internal === false && o.push({ ...v, interfaceName }) })
  return o
}, [])

export { getNetworkIPv4AddressList }
