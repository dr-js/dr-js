import { resolve, dirname, basename } from 'path'
import { strictEqual } from 'source/common/verify.js'
import { getRandomId } from 'source/common/math/random.js'
import { deleteDirectory, resetDirectory } from 'source/node/fs/Directory.js'
import { createLoggerExot } from 'source/node/module/Logger.js'
import { runSync } from 'source/node/run.js'
import { resolveCommand } from './ResolveCommand.js'

import {
  // loop config
  // defaultCommandStop,
  /* formatUnitConfig, */ formatLoopConfig,

  // loop state
  initLoopState, /* loadLoopState, */ saveLoopState, migrateLoopState, markLoopState,
  latestUnitStateHistory, // addUnitStateHistory,

  // loop
  // LOOP_INDEX,
  loopWaitAndStep, loopClue, loopMain, loopStop
} from './WatchLoop.js'

const { describe, it, before, after, info = console.log } = global

const TEST_ROOT = resolve(__dirname, 'test-watchloop-gitignore')
const fromRoot = (...args) => resolve(TEST_ROOT, ...args)

const LOOP_COUNT_SCALE = process.platform === 'win32' ? 0.25 : 1

const DR_JS = require.resolve('@dr-js/core/bin/index.js')
const DR_DEV = require.resolve('@dr-js/dev/bin/index.js')

const UNIT_CONFIG_LIST = [ {
  name: 'normal-process',
  clue: { commandPattern: 'Note: pattern-normal-process' },
  run: { start: { argList: [ 'node', basename(DR_JS), '--swg', '-N', 'Note: pattern-normal-process' ], cwd: dirname(DR_JS), logFile: fromRoot('process-log-normal-process.log') } }
}, {
  name: 'multi-process',
  clue: { commandPattern: /NOTE=pattern-multi-process/ },
  run: { start: { argList: [ 'node', basename(DR_DEV), '--EE', 'NOTE=pattern-multi-process', '-E', '--', 'node', DR_DEV, '-E', '--', 'node', DR_DEV, '-E', '--', 'node', DR_JS, '--swg' ], cwd: dirname(DR_DEV), logFile: fromRoot('process-log-multi-process.log') } }
}, {
  name: 'flaky-process',
  clue: { commandPattern: 'Note: pattern-flaky-process' },
  run: { start: { argList: [ 'node', basename(DR_JS), '--wait', '1024', '-N', 'Note: pattern-flaky-process' ], cwd: dirname(DR_JS), logFile: fromRoot('process-log-flaky-process.log') } }
}, {
  name: 'bloat-process',
  clue: { commandPattern: 'memory-bloater.js' },
  run: { start: { argList: [ 'node', 'WatchLoop.test/memory-bloater.js' ], cwd: __dirname, logFile: fromRoot('process-log-bloat-process.log') } },
  limit: { memoryMaxTotalMiB: 128 }
} ]

before(async () => {
  await resetDirectory(TEST_ROOT)
})
after(async () => {
  try {
    await deleteDirectory(TEST_ROOT) // comment out this line to check test log output
  } catch (error) { // NOTE: win32 may error on this one, stating `ENOTEMPTY: directory not empty, rmdir '...\test-watchloop-gitignore'`
    runSync([ resolveCommand('dr-js'), '--ps', 'tree' ])
    throw error
  }
})

describe('Node.System.WatchLoop', () => {
  it('loop', async () => {
    const loggerExot = createLoggerExot({ pathLogDirectory: fromRoot('log/'), getLogFileName: () => 'test.log', saveInterval: 100 })
    await loggerExot.up(info)
    const log = (...args) => {
      info(...args)
      loggerExot.add(...args)
    }
    log('[loop] start')

    let loopConfig = formatLoopConfig({
      stateFilePath: fromRoot('loopState.0.json'),
      loopTime: 32, // or the loop is too fast for bloat test
      unitConfigList: UNIT_CONFIG_LIST
    })
    let loopState = initLoopState(loopConfig)
    // console.log({ loopConfig, loopState })

    const runLoop = async (loopCount, isNoStart = false) => {
      while (loopCount--) {
        const { statusList } = await loopMain(loopConfig, loopState, { isNoStart }) // statusList only return on slow loop
        log(statusList ? `#${loopState.loopIndex}\n- ${statusList.join('\n- ')}` : `#${loopState.loopIndex}`)
        statusList && await saveLoopState(loopConfig, loopState) // lazy save
        await loopWaitAndStep(loopConfig, loopState)
      }
    }

    await runLoop(64 * LOOP_COUNT_SCALE)
    strictEqual(loopState.loopIndex, 64 * LOOP_COUNT_SCALE)
    strictEqual(Object.keys(loopState.unitStateMap).length, 4)
    strictEqual(latestUnitStateHistory(loopState.unitStateMap[ 'normal-process' ]).state, 'found')
    strictEqual(loopState.unitStateMap[ 'normal-process' ].historyList.length, 3)
    strictEqual(latestUnitStateHistory(loopState.unitStateMap[ 'multi-process' ]).state, 'found')
    strictEqual(loopState.unitStateMap[ 'multi-process' ].historyList.length, 3)
    strictEqual(loopState.unitStateMap[ 'flaky-process' ].historyList.length > 5, true, 'flaky process should restart more than once')
    strictEqual(loopState.unitStateMap[ 'flaky-process' ].latestFoundTime > 0, true, 'flaky process should run normal for some time')
    strictEqual(loopState.unitStateMap[ 'bloat-process' ].historyList.length > 5, true, 'bloat process should restart more than once')
    strictEqual(loopState.unitStateMap[ 'bloat-process' ].latestFoundTime > 0, true, 'bloat process should run normal for some time')

    {
      log('[loop] migrate (add unit, all-slow-loop)')
      const prevLoopConfig = loopConfig
      const prevLoopState = loopState
      loopConfig = formatLoopConfig({
        stateFilePath: fromRoot('loopState.1.json'),
        loopTime: 8, // all
        unitConfigList: [ ...UNIT_CONFIG_LIST, {
          name: 'bad-process',
          clue: { commandPattern: 'bad-process no pattern will keep crashing, and will cause all fast loop become slow check loop' },
          run: { start: { argList: [ getRandomId('non-exist-command-') ] } }
        } ]
      })
      loopState = await migrateLoopState(loopConfig, prevLoopConfig, prevLoopState)
      await runLoop(32 * LOOP_COUNT_SCALE)
      strictEqual(loopState.loopIndex, (64 + 32) * LOOP_COUNT_SCALE)
      strictEqual(Object.keys(loopState.unitStateMap).length, 5)
      strictEqual(loopState.unitStateMap[ 'bad-process' ].historyList.length, 2, 'bad process should stuck in restart')
      strictEqual(loopState.unitStateMap[ 'bad-process' ].latestFoundTime, 0, 'bad process should not reach found state')
    }

    {
      log('[loop] migrate (drop unit, stabilize)')
      await runLoop(2, 'no-start')
      log('[loop] migrate (drop unit)')
      const prevLoopConfig = loopConfig
      const prevLoopState = loopState
      loopConfig = formatLoopConfig({
        stateFilePath: fromRoot('loopState.2.json'),
        loopTime: 32, // or the loop is too fast for bloat test
        unitConfigList: UNIT_CONFIG_LIST.slice(0, 2)
      })
      loopState = await migrateLoopState(loopConfig, prevLoopConfig, prevLoopState)
      await runLoop(32 * LOOP_COUNT_SCALE)
      strictEqual(loopState.loopIndex, (64 + 32 + 32) * LOOP_COUNT_SCALE + 2)
      strictEqual(Object.keys(loopState.unitStateMap).length, 2)
    }

    log('[loop] stop')
    markLoopState(loopConfig, loopState, 'stop')
    await loopStop(loopConfig, loopState)
    await loopWaitAndStep(loopConfig, loopState)
    await loopClue(loopConfig, loopState)
    await saveLoopState({ ...loopConfig, stateFilePath: fromRoot('loopState.last.json') }, loopState)
    strictEqual(loopState.loopIndex, (64 + 32 + 32) * LOOP_COUNT_SCALE + 2 + 1)
    strictEqual(Object.keys(loopState.unitStateMap).length, 2)
    strictEqual(latestUnitStateHistory(loopState.unitStateMap[ 'normal-process' ]).state, 'missing')
    strictEqual(loopState.unitStateMap[ 'normal-process' ].historyList.length, 5)
    strictEqual(latestUnitStateHistory(loopState.unitStateMap[ 'multi-process' ]).state, 'missing')
    strictEqual(loopState.unitStateMap[ 'multi-process' ].historyList.length, 5)

    await loggerExot.down()
  })
})
