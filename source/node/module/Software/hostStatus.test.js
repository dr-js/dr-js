import { indentLine } from 'source/common/string.js'
import {
  getCommonHostStatus
} from './hostStatus.js'

const { describe, it, info = console.log } = globalThis

describe('Node.Module.Software.hostStatus', () => {
  it('getCommonHostStatus()', async () => {
    const resultList = await getCommonHostStatus()

    for (const [ title, output ] of resultList) info(`[${title}]\n${indentLine(output)}`)
  })
})
