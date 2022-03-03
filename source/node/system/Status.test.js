import { strictEqual } from 'source/common/verify.js'
import { runStdoutSync } from 'source/node/run.js'
import {
  describeSystemStatus,
  getSystemInfo,
  V8_HEAP_RESERVED_SIZE, getV8HeapStatus
} from './Status.js'

const { describe, it, info = console.log } = globalThis

describe('Node.System.Status', () => {
  it('describeSystemStatus()', () => {
    info(describeSystemStatus())
  })

  it('getSystemInfo()', () => {
    info(JSON.stringify(getSystemInfo(), null, 2))
  })

  it('check "V8_HEAP_RESERVED_SIZE"', () => {
    strictEqual(parseInt(runStdoutSync([ process.execPath, '--max-old-space-size=8', '-p', 'v8.getHeapStatistics().heap_size_limit / 1024 / 1024 - 8' ])), V8_HEAP_RESERVED_SIZE / 1024 / 1024)
    strictEqual(parseInt(runStdoutSync([ process.execPath, '--max-old-space-size=64', '-p', 'v8.getHeapStatistics().heap_size_limit / 1024 / 1024 - 64' ])), V8_HEAP_RESERVED_SIZE / 1024 / 1024)
    strictEqual(parseInt(runStdoutSync([ process.execPath, '--max-old-space-size=512', '-p', 'v8.getHeapStatistics().heap_size_limit / 1024 / 1024 - 512' ])), V8_HEAP_RESERVED_SIZE / 1024 / 1024)
  })

  it('getV8HeapStatus()', () => {
    info(JSON.stringify(getV8HeapStatus(), null, 2))
  })
})
