import {
  describeSystemStatus,
  getSystemInfo
} from './Status.js'

const { describe, it, info = console.log } = globalThis

describe('Node.System.Status', () => {
  it('describeSystemStatus()', () => {
    info(describeSystemStatus())
  })

  it('getSystemInfo()', () => {
    info(JSON.stringify(getSystemInfo(), null, 2))
  })
})
