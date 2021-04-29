import { includes, strictEqual } from 'source/common/verify.js'
import { catchSync, catchPromise } from 'source/common/error.js'
import { getRandomId } from 'source/common/math/random.js'
import { setTimeoutAsync } from 'source/common/time.js'
import {
  describeRunOutcome, describeRunOutcomeSync,
  run, runSync, runDetached
} from './run.js'

const { describe, it, info = console.log } = global

const TEST_ARG_LIST_EXIT_0 = [ 'node', '-e', 'console.log("TEST_ARG_LIST_EXIT_0", process.version); process.exitCode = 0' ]
const TEST_ARG_LIST_EXIT_42 = [ 'node', '-e', 'console.log("TEST_ARG_LIST_EXIT_42", process.version); process.exitCode = 42' ]
const TEST_ARG_LIST_BAD = [ getRandomId('no-exist-bad-test-command-'), ...[ 0, 1, 2, 3 ].map(getRandomId) ]

const TITLE_DESCRIBE = '[DESCRIBE-RUN-OUTCOME] ====\n'

describe('Node.Run', () => {
  it('run()', async () => {
    {
      const outcome = await run(TEST_ARG_LIST_EXIT_0, { stdio: 'ignore' }).promise
      info(TITLE_DESCRIBE + await describeRunOutcome(outcome))
      strictEqual(outcome.code, 0)
    }
    {
      const { error: outcome } = await catchPromise(run(TEST_ARG_LIST_EXIT_42, { stdio: 'ignore' }).promise)
      info(TITLE_DESCRIBE + await describeRunOutcome(outcome))
      strictEqual(outcome.code, 42)
    }
    {
      const { error: outcome } = await catchPromise(run(TEST_ARG_LIST_BAD, { stdio: 'ignore' }).promise)
      info(TITLE_DESCRIBE + await describeRunOutcome(outcome))
      includes(outcome.message, 'ENOENT')
      strictEqual(outcome.command, TEST_ARG_LIST_BAD[ 0 ])
    }
  })

  it('run() quiet', async () => {
    {
      const { promise, stdoutPromise } = run(TEST_ARG_LIST_EXIT_0, { quiet: true })
      const outcome = await promise
      info(TITLE_DESCRIBE + await describeRunOutcome(outcome))
      includes(String(await stdoutPromise), 'TEST_ARG_LIST_EXIT_0')
    }
    {
      const { promise, stdoutPromise } = run(TEST_ARG_LIST_EXIT_42, { quiet: true })
      const { error: outcome } = await catchPromise(promise)
      info(TITLE_DESCRIBE + await describeRunOutcome(outcome))
      includes(String(await stdoutPromise), 'TEST_ARG_LIST_EXIT_42')
    }
    {
      const { error: outcome } = await catchPromise(run(TEST_ARG_LIST_BAD, { quiet: true }).promise)
      info(TITLE_DESCRIBE + await describeRunOutcome(outcome))
      includes(outcome.message, 'ENOENT')
      strictEqual(outcome.command, TEST_ARG_LIST_BAD[ 0 ])
    }
  })

  it('runSync()', () => {
    {
      const outcome = runSync(TEST_ARG_LIST_EXIT_0, { stdio: 'ignore' })
      strictEqual(outcome.code, 0)
    }
    {
      const { error: outcome } = catchSync(runSync, TEST_ARG_LIST_EXIT_42, { stdio: 'ignore' })
      strictEqual(outcome.code, 42)
    }
    {
      const { error: outcome } = catchSync(runSync, TEST_ARG_LIST_BAD, { stdio: 'ignore' })
      info(TITLE_DESCRIBE + describeRunOutcomeSync(outcome)) // should be sync
      includes(outcome.message, 'ENOENT')
      strictEqual(outcome.command, TEST_ARG_LIST_BAD[ 0 ])
    }
  })

  it('runSync() quiet', () => {
    {
      const outcome = runSync(TEST_ARG_LIST_EXIT_0, { quiet: true })
      info(describeRunOutcomeSync(outcome))
      includes(String(outcome.stdout), 'TEST_ARG_LIST_EXIT_0')
    }
    {
      const { error: outcome } = catchSync(runSync, TEST_ARG_LIST_EXIT_42, { quiet: true })
      info(describeRunOutcomeSync(outcome))
      includes(String(outcome.stdout), 'TEST_ARG_LIST_EXIT_42')
    }

    const { error: outcome } = catchSync(runSync, TEST_ARG_LIST_BAD, { quiet: true })
    info(TITLE_DESCRIBE + describeRunOutcomeSync(outcome)) // should be sync
    includes(outcome.message, 'ENOENT')
    strictEqual(outcome.command, TEST_ARG_LIST_BAD[ 0 ])
  })

  it('runDetached()', async () => {
    const log = (subProcess) => info(`subProcess pid: ${subProcess.pid}, code: ${subProcess.exitCode}`)
    {
      const { subProcess } = runDetached(TEST_ARG_LIST_EXIT_0)
      log(subProcess)
      strictEqual(subProcess.pid > 0, true)
      strictEqual(subProcess.exitCode, null)
      await setTimeoutAsync(200)
      log(subProcess)
      strictEqual(subProcess.exitCode, 0)
    }
    {
      const { subProcess } = runDetached(TEST_ARG_LIST_EXIT_42)
      log(subProcess)
      strictEqual(subProcess.pid > 0, true)
      strictEqual(subProcess.exitCode, null)
      await setTimeoutAsync(200)
      log(subProcess)
      strictEqual(subProcess.exitCode, 42)
    }
    {
      const { subProcess } = runDetached(TEST_ARG_LIST_BAD)
      log(subProcess)
      strictEqual(subProcess.pid > 0, false) // not a number
      strictEqual(subProcess.exitCode, null)
      await setTimeoutAsync(200)
      log(subProcess)
      strictEqual(subProcess.exitCode !== 0, true)
    }
  })
})
