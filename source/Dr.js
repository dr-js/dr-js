import Config from './config'
import Common from './common'

let Dr = Config.GLOBAL.Dr = {
  ...Config,
  ...Common,

  // the lower level the fewer & important message is printed
  // normally: 5 - ALL, 10 - WARN, 15+ - CUSTOM DEBUG LEVEL
  debugLevel: 0,
  log: (...args) => Common.logList(args),
  debug: (debugLevel, ...args) => Dr.debugLevel && (Dr.debugLevel <= debugLevel) && Common.logList(args),
  assert: (...args) => {
    (Dr.debugLevel > 15) && Common.logList(([ '[' + Dr.now().toFixed(4) + 'sec]', '[assert]' ]).concat(args))
    Common.assertList(args)
  },
  logError: (error, ...args) => {
    Common.logList([ 'Error', error ])
    Common.logList([ ...args ])
    error.stack && Common.logList([ error.stack ])
  },

  toggle: new Common.Toggle()
}

export default Dr
