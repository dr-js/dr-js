import { catchAsync } from 'source/common/error.js'
import {
  describeRunOutcome, describeRunOutcomeSync,
  run, runSync
} from 'source/node/run.js'

/** @deprecated */ const runDeprecate = ({ command, argList = [], option, quiet = false, describeError = false }) => run([ command, ...argList ], { quiet, describeError, ...option })
/** @deprecated */ const runSyncDeprecate = ({ command, argList = [], option, quiet = false, describeError = false }) => runSync([ command, ...argList ], { quiet, describeError, ...option })

/** @deprecated */ const withCwd = (pathCwd, taskAsync) => async (...args) => { // TODO: DEPRECATE: moved to `@dr-js/dev`
  const prevCwd = process.cwd()
  process.chdir(pathCwd)
  const { result, error } = await catchAsync(taskAsync, ...args)
  process.chdir(prevCwd)
  if (error) throw error
  return result
}

export {
  describeRunOutcome, describeRunOutcomeSync, // TODO: DEPRECATE
  runDeprecate as run, runSyncDeprecate as runSync, // TODO: DEPRECATE

  withCwd // TODO: DEPRECATE: moved to `@dr-js/dev`
}
