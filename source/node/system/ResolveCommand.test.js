import { strictEqual } from 'source/common/verify.js'
import {
  resolveCommandName,
  resolveCommandNameAsync
} from './ResolveCommand.js'

const { describe, it, info = console.log } = globalThis

describe('Node.Module.ResolveCommand', () => {
  const COMMAND_NAME_LIST = [
    // [ commandName, isExpectResult ]
    [ process.platform === 'win32' ? 'where' : 'which', true ],
    [ 'npm', true ],
    [ 'npx', true ],
    [ 'node', true ],
    [ 'git', true ],
    [ 'tar', true ],
    [ 'noop-0123456789', false ] // non-exist commandName should return ""
  ]

  it('resolveCommandName()', () => {
    // strictEqual(resolveCommandName(process.argv0), process.argv[ 0 ], 'should return same node path')

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
