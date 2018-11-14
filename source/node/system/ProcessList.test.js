import { ok } from 'assert'
import { run } from './Run'
import { padTable } from 'source/common/format'

import { getProcessList, getProcessTree } from './ProcessList'

const { describe, it } = global

describe('Node.System.ProcessList', () => {
  it('getProcessList()', async () => {
    const result = await getProcessList()
    __DEV__ && console.log(padTable({
      table: [
        [ 'pid', 'ppid', 'command' ],
        ...result.map(({ pid, ppid, command }) => [ pid, ppid, command ])
      ]
    }))

    const processItem = result.find(({ pid, command }) => pid === process.pid && command.includes('node'))
    const subProcessItem = result.find(({ ppid }) => ppid === process.pid)
    __DEV__ && console.log({ processItem, subProcessItem })

    ok(processItem, 'should have this node process')
    ok(subProcessItem, 'should have the sub process for list-process')
  })

  it('getProcessList() sub-process', async () => {
    const { subProcess, promise } = run({ command: 'npx dr-js --sss', option: { stdio: 'ignore' } })

    const result = await getProcessList()

    subProcess.kill()
    await promise.catch(() => {})

    const subProcessItem = result.find(({ pid, ppid, command }) => (
      pid === subProcess.pid &&
      ppid === process.pid &&
      command.includes('npx dr-js --sss')
    ))
    __DEV__ && console.log({ subProcessItem })

    ok(subProcessItem, 'should have sub-process in list')
  })

  it('getProcessTree()', async () => {
    const processList = await getProcessList()
    const rootProcess = await getProcessTree(processList)
    const processItem = processList.find(({ pid, command }) => pid === process.pid && command.includes('node'))
    const subProcessItem = processList.find(({ ppid }) => ppid === process.pid)
    __DEV__ && console.log({ processItem, subProcessItem })

    ok(rootProcess, 'should have rootProcess')
    ok(processItem.subTree, 'should have subTree in this node process')
    ok(processItem.subTree[ subProcessItem.pid ] === subProcessItem, 'should have in subTree the sub process for list-process')
  })
})
