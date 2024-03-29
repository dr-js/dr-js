import { strictEqual, truthy } from 'source/common/verify.js'
import { padTable } from 'source/common/format.js'
import { run } from 'source/node/run.js'

import {
  getProcessListAsync,
  toProcessTree,
  killProcessInfoAsync
} from './Process.js'

const { describe, it } = globalThis

describe('Node.System.Process', () => {
  it('getProcessListAsync()', async () => {
    const result = await getProcessListAsync()
    __DEV__ && console.log(padTable({
      table: [
        [ 'pid', 'ppid', 'command' ],
        ...result.map(({ pid, ppid, command }) => [ pid, ppid, command ])
      ]
    }))

    const processItem = result.find(({ pid, command }) => pid === process.pid && command.includes('node'))
    const subProcessItem = result.find(({ ppid }) => ppid === process.pid)
    __DEV__ && console.log({ processItem, subProcessItem })

    truthy(Boolean(processItem), 'should have this node process')
    truthy(Boolean(subProcessItem), 'should have the sub process for list-process')
  })

  it('getProcessList() sub-process', async () => {
    const { subProcess, promise } = run([ process.execPath, '-e', 'setTimeout(console.log, 200)' ], { quiet: true })
    const result = await getProcessListAsync()
    await Promise.all([
      killProcessInfoAsync(subProcess),
      promise.catch((error) => { __DEV__ && console.log(error) })
    ])
    await killProcessInfoAsync(subProcess) // allow kill killed

    const subProcessItem = result.find(({ pid, ppid, command }) => (
      pid === subProcess.pid &&
      ppid === process.pid &&
      command.includes('setTimeout(console.log, 200)')
    ))
    __DEV__ && console.log({ subProcessItem })

    truthy(Boolean(subProcessItem), 'should have sub-process in list')
  })

  it('toProcessTree()', async () => {
    const processList = await getProcessListAsync()
    const rootProcess = toProcessTree(processList)
    const processItem = processList.find(({ pid, command }) => pid === process.pid && command.includes('node'))
    const subProcessItem = processList.find(({ ppid }) => ppid === process.pid)
    __DEV__ && console.log({ processItem, subProcessItem })

    truthy(Boolean(rootProcess), 'should have rootProcess')
    truthy(Boolean(processItem.subTree), 'should have subTree in this node process')
    strictEqual(processItem.subTree[ subProcessItem.pid ], subProcessItem, 'should have in subTree the sub process for list-process')
  })
})
