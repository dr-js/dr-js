import { strictEqual } from 'source/common/verify'
import {
  resolveCommandName,
  resolveCommandNameAsync
} from './ResolveCommand'

const { describe, it, info = console.log } = global

describe('Node.Module.ResolveCommand', () => {
  const COMMAND_NAME_LIST = [
    // [ commandName, isExpectResult ]
    [ process.platform === 'win32' ? 'ipconfig' : 'ifconfig', true ],
    [ 'npm', true ],
    [ 'npx', true ],
    [ 'node', true ],
    [ 'git', true ],
    [ 'tar', true ],
    [ 'noop-0123456789', false ] // non-exist commandName should return ""
  ]

  it('resolveCommandName()', () => {
    for (const [ commandName, isExpectResult ] of COMMAND_NAME_LIST) {
      const result = resolveCommandName(commandName)
      info(`${JSON.stringify(commandName)} => ${JSON.stringify(result)}`)
      strictEqual(Boolean(result), isExpectResult)
    }
  })

  it('resolveCommandNameAsync()', async () => {
    for (const [ commandName, isExpectResult ] of COMMAND_NAME_LIST) {
      const result = await resolveCommandNameAsync(commandName)
      info(`${JSON.stringify(commandName)} => ${JSON.stringify(result)}`)
      strictEqual(Boolean(result), isExpectResult)
    }
  })
})
