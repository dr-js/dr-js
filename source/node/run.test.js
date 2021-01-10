import { strictEqual } from 'source/common/verify'
import { catchSync, catchPromise } from 'source/common/error'
import { getRandomId } from 'source/common/math/random'
import {
  describeRunOutcome, describeRunOutcomeSync,
  run, runSync
} from './run'

const { describe, it, info = console.log } = global

const TEST_ARG_LIST = (process.platform === 'win32' ? 'CMD.exe /S /C dir' : 'ls -l').split(' ')
const TEST_BAD_ARG_LIST = [ getRandomId('no-exist-bad-test-command-'), ...[ 0, 1, 2, 3 ].map(getRandomId) ]

const TITLE_DESCRIBE = '[DESCRIBE-RUN-OUTCOME] ====\n'

describe('Node.Run', () => {
  it('run()', async () => {
    const outcome = await run(TEST_ARG_LIST, { stdio: 'ignore' }).promise
    info(TITLE_DESCRIBE + await describeRunOutcome(outcome))
    strictEqual(outcome.code, 0)

    const { error } = await catchPromise(run(TEST_BAD_ARG_LIST, { stdio: 'ignore' }).promise)
    info(TITLE_DESCRIBE + await describeRunOutcome(error))
    strictEqual(error.command, TEST_BAD_ARG_LIST[ 0 ])
  })

  it('run() quiet', async () => {
    const { promise, stdoutPromise } = run(TEST_ARG_LIST, { cwd: __dirname, quiet: true })
    const outcome = await promise
    info(TITLE_DESCRIBE + await describeRunOutcome(outcome))
    const stdoutString = String(await stdoutPromise)
    strictEqual(stdoutString.includes('run.test.js'), true)
    strictEqual(stdoutString.includes('run.js'), true)

    const { error } = await catchPromise(run(TEST_BAD_ARG_LIST, { quiet: true }).promise)
    info(TITLE_DESCRIBE + await describeRunOutcome(error))
    strictEqual(error.command, TEST_BAD_ARG_LIST[ 0 ])
  })

  it('runSync()', () => {
    const { code } = runSync(TEST_ARG_LIST, { stdio: 'ignore' })
    strictEqual(code, 0)

    const { error } = catchSync(runSync, TEST_BAD_ARG_LIST, { stdio: 'ignore' })
    info(TITLE_DESCRIBE + describeRunOutcomeSync(error)) // should be sync
    strictEqual(error.command, TEST_BAD_ARG_LIST[ 0 ])
    strictEqual(typeof describeRunOutcome(error), 'string')
  })

  it('runSync() quiet', () => {
    const outcome = runSync(TEST_ARG_LIST, { cwd: __dirname, quiet: true })
    info(describeRunOutcomeSync(outcome))
    const stdoutString = String(outcome.stdout)
    strictEqual(stdoutString.includes('run.test.js'), true)
    strictEqual(stdoutString.includes('run.js'), true)

    const { error } = catchSync(runSync, TEST_BAD_ARG_LIST, { quiet: true })
    info(TITLE_DESCRIBE + describeRunOutcomeSync(error)) // should be sync
    strictEqual(error.command, TEST_BAD_ARG_LIST[ 0 ])
    strictEqual(typeof describeRunOutcome(error), 'string')
  })
})
