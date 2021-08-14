import { strictEqual, truthy } from 'source/common/verify.js'
import { catchSync, catchPromise } from 'source/common/error.js'
import { getRandomId } from 'source/common/math/random.js'
import { describeRunOutcome, describeRunOutcomeSync, run, runSync } from './Run.js' // TODO: DEPRECATE: old test

const { describe, it, info = console.log } = globalThis

const [ TEST_COMMAND, ...TEST_ARG_LIST ] = (process.platform === 'win32' ? 'CMD.exe /S /C dir' : 'ls -l').split(' ')

const TEST_BAD_COMMAND = getRandomId('no-exist-bad-test-command-')
const TEST_BAD_ARG_LIST = [ 0, 1, 2, 3 ].map(getRandomId)

const TITLE_DESCRIBE = '[DESCRIBE-RUN-OUTCOME] ====\n'

describe('Node.System.Run', () => {
  it('run()', async () => {
    const outcome = await run({ command: TEST_COMMAND, argList: TEST_ARG_LIST, option: { stdio: 'ignore' } }).promise
    info(TITLE_DESCRIBE + await describeRunOutcome(outcome))
    strictEqual(outcome.code, 0)

    const { error } = await catchPromise(run({ command: TEST_BAD_COMMAND, argList: TEST_BAD_ARG_LIST, option: { stdio: 'ignore' } }).promise)
    info(TITLE_DESCRIBE + await describeRunOutcome(error))
    strictEqual(error.command, TEST_BAD_COMMAND)
  })

  it('run() quiet', async () => {
    const { promise, stdoutPromise } = run({ command: TEST_COMMAND, argList: TEST_ARG_LIST, option: { cwd: __dirname }, quiet: true })
    const outcome = await promise
    info(TITLE_DESCRIBE + await describeRunOutcome(outcome))
    const stdoutString = String(await stdoutPromise)
    truthy(stdoutString.includes('Run.test.js'))
    truthy(stdoutString.includes('Run.js'))

    const { error } = await catchPromise(run({ command: TEST_BAD_COMMAND, argList: TEST_BAD_ARG_LIST, quiet: true }).promise)
    info(TITLE_DESCRIBE + await describeRunOutcome(error))
    strictEqual(error.command, TEST_BAD_COMMAND)
  })

  it('runSync()', () => {
    const { code } = runSync({ command: TEST_COMMAND, argList: TEST_ARG_LIST, option: { stdio: 'ignore' } })
    strictEqual(code, 0)

    const { error } = catchSync(runSync, { command: TEST_BAD_COMMAND, argList: TEST_BAD_ARG_LIST, option: { stdio: 'ignore' } })
    info(TITLE_DESCRIBE + describeRunOutcomeSync(error)) // should be sync
    strictEqual(error.command, TEST_BAD_COMMAND)
    strictEqual(typeof describeRunOutcome(error), 'string')
  })

  it('runSync() quiet', () => {
    const outcome = runSync({ command: TEST_COMMAND, argList: TEST_ARG_LIST, option: { cwd: __dirname }, quiet: true })
    info(describeRunOutcomeSync(outcome))
    const stdoutString = String(outcome.stdout)
    truthy(stdoutString.includes('Run.test.js'))
    truthy(stdoutString.includes('Run.js'))

    const { error } = catchSync(runSync, { command: TEST_BAD_COMMAND, argList: TEST_BAD_ARG_LIST, quiet: true })
    info(TITLE_DESCRIBE + describeRunOutcomeSync(error)) // should be sync
    strictEqual(error.command, TEST_BAD_COMMAND)
    strictEqual(typeof describeRunOutcome(error), 'string')
  })
})
