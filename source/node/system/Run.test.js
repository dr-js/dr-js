import { strictEqual } from 'source/common/verify'
import { run, runSync } from './Run'

const { describe, it } = global

const [ TEST_COMMAND, ...TEST_ARG_LIST ] = (process.platform === 'win32' ? 'CMD.exe /S /C dir' : 'ls -l').split(' ')

describe('Node.System.Run', () => {
  it('run()', async () => {
    const { code } = await run({ command: TEST_COMMAND, argList: TEST_ARG_LIST, option: { stdio: 'ignore' } }).promise
    strictEqual(code, 0)
  })

  it('run() quiet', async () => {
    const { promise, stdoutPromise } = run({ command: TEST_COMMAND, argList: TEST_ARG_LIST, option: { cwd: __dirname }, quiet: true })
    await promise
    const stdoutString = String(await stdoutPromise)
    strictEqual(stdoutString.includes('Run.test.js'), true)
    strictEqual(stdoutString.includes('Run.js'), true)
  })

  it('runSync()', () => {
    const { code } = runSync({ command: TEST_COMMAND, argList: TEST_ARG_LIST, option: { stdio: 'ignore' } })
    strictEqual(code, 0)
  })

  it('runSync() quiet', () => {
    const { stdout } = runSync({ command: TEST_COMMAND, argList: TEST_ARG_LIST, option: { cwd: __dirname }, quiet: true })
    const stdoutString = String(stdout)
    strictEqual(stdoutString.includes('Run.test.js'), true)
    strictEqual(stdoutString.includes('Run.js'), true)
  })
})
