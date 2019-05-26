import { strictEqual } from 'source/common/verify'
import { run } from './Run'
import { padTable } from 'source/common/format'

import {
  getProcessListAsync,
  toProcessTree
} from './ProcessStatus'

const { describe, it } = global

describe('Node.System.ProcessStatus', () => {
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

    strictEqual(Boolean(processItem), true, 'should have this node process')
    strictEqual(Boolean(subProcessItem), true, 'should have the sub process for list-process')
  })

  it('getProcessList() sub-process', async () => {
    const { subProcess, promise } = run({
      command: 'node',
      argList: [ '-e', 'setTimeout(console.log, 200)' ],
      option: { stdio: 'ignore', shell: false } // NOTE: `shell: true` on win32 will leak process
    })
    const result = await getProcessListAsync()

    subProcess.kill()
    await promise.catch((error) => { __DEV__ && console.log(error) })

    const subProcessItem = result.find(({ pid, ppid, command }) => (
      pid === subProcess.pid &&
      ppid === process.pid &&
      command.includes('setTimeout(console.log, 200)')
    ))
    __DEV__ && console.log({ subProcessItem })

    strictEqual(Boolean(subProcessItem), true, 'should have sub-process in list')
  })

  it('toProcessTree()', async () => {
    const processList = await getProcessListAsync()
    const rootProcess = toProcessTree(processList)
    const processItem = processList.find(({ pid, command }) => pid === process.pid && command.includes('node'))
    const subProcessItem = processList.find(({ ppid }) => ppid === process.pid)
    __DEV__ && console.log({ processItem, subProcessItem })

    strictEqual(Boolean(rootProcess), true, 'should have rootProcess')
    strictEqual(Boolean(processItem.subTree), true, 'should have subTree in this node process')
    strictEqual(processItem.subTree[ subProcessItem.pid ], subProcessItem, 'should have in subTree the sub process for list-process')
  })
})
