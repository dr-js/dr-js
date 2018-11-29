import { strictEqual } from 'source/common/verify'
import { run, runSync, runQuiet } from './Run'

const { describe, it } = global

const TEST_COMMAND = process.platform === 'win32' ? 'dir' : 'ls -l'

describe('Node.System.Run', () => {
  it('run()', async () => {
    const { code } = await run({ command: TEST_COMMAND, option: { stdio: 'ignore' } }).promise
    strictEqual(code, 0)
  })

  it('runSync()', async () => {
    const { code } = runSync({ command: TEST_COMMAND, option: { stdio: 'ignore' } })
    strictEqual(code, 0)
  })

  it('runQuiet()', async () => {
    const { promise, stdoutBufferPromise } = runQuiet({ command: TEST_COMMAND, option: { cwd: __dirname } })
    await promise
    const stdoutString = (await stdoutBufferPromise).toString()
    strictEqual(stdoutString.includes('Run.test.js'), true)
    strictEqual(stdoutString.includes('Run.js'), true)
  })
})
