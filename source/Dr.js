import { Extend, Module } from './common'

let Dr = {
  ...Extend,
  Module,

  // the lower level the fewer & important message is printed
  // normally: 5 - ALL, 10 - WARN, 15+ - CUSTOM DEBUG LEVEL
  debugLevel: 0,
  debug: (debugLevel, ...args) => Dr.debugLevel && (Dr.debugLevel <= debugLevel) && Extend.logList(args),

  Event: new Module.Event(),
  Toggle: new Module.Toggle(),

  initModuleManager: () => {
    // old fashioned way
    const moduleManager = new Module.ModuleManager()
    Object.assign(Dr, {
      Declare: moduleManager.declare.bind(moduleManager),
      Require: moduleManager.require.bind(moduleManager),
      Implement: moduleManager.implement.bind(moduleManager),
      LoadAll: moduleManager.loadAll.bind(moduleManager),
      Get: moduleManager.get.bind(moduleManager),
      GetNew: (name, ...args) => {
        const Module = moduleManager.get(name)
        return Module ? new Module(...args) : null
      }
    })
    for (const name in Dr.Module) {
      moduleManager.declare(name)
      moduleManager.setModule(name, Dr.Module[ name ])
    }
    return moduleManager
  }
}

Extend.GLOBAL.Dr = Dr
export { Dr }
export default Dr
