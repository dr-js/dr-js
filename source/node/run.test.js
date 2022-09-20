import { includes, strictEqual, truthy } from 'source/common/verify.js'
import { catchSync, catchPromise } from 'source/common/error.js'
import { getRandomId62S } from 'source/common/math/random.js'
import { setTimeoutAsync } from 'source/common/time.js'
import {
  describeRunOutcome, describeRunOutcomeSync,
  run, runSync, runDetached
} from './run.js'

const { describe, it, info = console.log } = globalThis
const log = __DEV__ ? info : () => {}

const TEST_ARG_LIST_EXIT_0 = [ 'node', '-e', 'console.log("TEST_ARG_LIST_EXIT_0", process.version); process.exitCode = 0' ]
const TEST_ARG_LIST_EXIT_42 = [ 'node', '-e', 'console.log("TEST_ARG_LIST_EXIT_42", process.version); process.exitCode = 42' ]
const TEST_ARG_LIST_BAD = [ getRandomId62S('no-exist-bad-test-command-'), ...[ 0, 1, 2, 3 ].map(getRandomId62S) ]

const TITLE_DESCRIBE = '[DESCRIBE-RUN-OUTCOME] ====\n'

describe('Node.Run', () => {
  it('run()', async () => {
    {
      const outcome = await run(TEST_ARG_LIST_EXIT_0, { stdio: 'ignore' }).promise
      log(TITLE_DESCRIBE + await describeRunOutcome(outcome))
      strictEqual(outcome.code, 0)
    }
    {
      const { error: outcome } = await catchPromise(run(TEST_ARG_LIST_EXIT_42, { stdio: 'ignore' }).promise)
      log(TITLE_DESCRIBE + await describeRunOutcome(outcome))
      strictEqual(outcome.code, 42)
    }
    {
      const { error: outcome } = await catchPromise(run(TEST_ARG_LIST_BAD, { stdio: 'ignore' }).promise)
      log(TITLE_DESCRIBE + await describeRunOutcome(outcome))
      includes(outcome.message, 'ENOENT')
      strictEqual(outcome.command, TEST_ARG_LIST_BAD[ 0 ])
    }
  })

  it('run() quiet', async () => {
    {
      const { promise, stdoutPromise } = run(TEST_ARG_LIST_EXIT_0, { quiet: true })
      const outcome = await promise
      log(TITLE_DESCRIBE + await describeRunOutcome(outcome))
      includes(String(await stdoutPromise), 'TEST_ARG_LIST_EXIT_0')
    }
    {
      const { promise, stdoutPromise } = run(TEST_ARG_LIST_EXIT_42, { quiet: true })
      const { error: outcome } = await catchPromise(promise)
      log(TITLE_DESCRIBE + await describeRunOutcome(outcome))
      includes(String(await stdoutPromise), 'TEST_ARG_LIST_EXIT_42')
    }
    {
      const { error: outcome } = await catchPromise(run(TEST_ARG_LIST_BAD, { quiet: true }).promise)
      log(TITLE_DESCRIBE + await describeRunOutcome(outcome))
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
      log(TITLE_DESCRIBE + describeRunOutcomeSync(outcome)) // should be sync
      includes(outcome.message, 'ENOENT')
      strictEqual(outcome.command, TEST_ARG_LIST_BAD[ 0 ])
    }
  })

  it('runSync() quiet', () => {
    {
      const outcome = runSync(TEST_ARG_LIST_EXIT_0, { quiet: true })
      log(describeRunOutcomeSync(outcome))
      includes(String(outcome.stdout), 'TEST_ARG_LIST_EXIT_0')
    }
    {
      const { error: outcome } = catchSync(runSync, TEST_ARG_LIST_EXIT_42, { quiet: true })
      log(describeRunOutcomeSync(outcome))
      includes(String(outcome.stdout), 'TEST_ARG_LIST_EXIT_42')
    }

    const { error: outcome } = catchSync(runSync, TEST_ARG_LIST_BAD, { quiet: true })
    log(TITLE_DESCRIBE + describeRunOutcomeSync(outcome)) // should be sync
    includes(outcome.message, 'ENOENT')
    strictEqual(outcome.command, TEST_ARG_LIST_BAD[ 0 ])
  })

  it('runDetached()', async () => {
    const __log = (subProcess) => log(`subProcess pid: ${subProcess.pid}, code: ${subProcess.exitCode}`)
    {
      const { subProcess } = runDetached(TEST_ARG_LIST_EXIT_0)
      __log(subProcess)
      truthy(subProcess.pid > 0)
      strictEqual(subProcess.exitCode, null)
      await setTimeoutAsync(200)
      __log(subProcess)
      strictEqual(subProcess.exitCode, 0)
    }
    {
      const { subProcess } = runDetached(TEST_ARG_LIST_EXIT_42)
      __log(subProcess)
      truthy(subProcess.pid > 0)
      strictEqual(subProcess.exitCode, null)
      await setTimeoutAsync(200)
      __log(subProcess)
      strictEqual(subProcess.exitCode, 42)
    }
    {
      const { subProcess } = runDetached(TEST_ARG_LIST_BAD)
      __log(subProcess)
      truthy(!(subProcess.pid > 0)) // not a number
      strictEqual(subProcess.exitCode, null)
      await setTimeoutAsync(200)
      __log(subProcess)
      truthy(subProcess.exitCode !== 0)
    }
  })
})
