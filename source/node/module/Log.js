import { createDummyExot } from 'source/common/module/Exot.js'
import { createLoggerExot } from 'source/node/module/Logger.js'

const prefixTime = ({ add, ...loggerExot }) => ({
  ...loggerExot,
  add: (...args) => add(new Date().toISOString(), ...args)
})

// support `add()` before `up()`
const configureLog = ({
  pathLogDirectory,
  logFilePrefix = '',
  isSingleFile = false
} = {}) => ({
  loggerExot: prefixTime(pathLogDirectory
    ? createLoggerExot({
      pathLogDirectory,
      ...(isSingleFile ? {
        getLogFileName: () => logFilePrefix || 'log',
        splitInterval: 0 // no split
      } : {
        getLogFileName: () => `${logFilePrefix}${(new Date().toISOString()).replace(/\W/g, '-')}.log`
      }),
      flags: 'a' // append, not reset file if exist
    })
    : createDummyExot({
      idPrefix: 'log-',
      add: console.log,
      save: () => {},
      split: () => {}
    })
  )
})

export { configureLog }
