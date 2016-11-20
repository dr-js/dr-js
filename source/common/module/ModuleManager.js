import { GLOBAL, assert, log, warn } from '../extend'

export default class ModuleManager {
  constructor () {
    this.moduleDataMap = new Map()

    this.getModuleData = (name) => {
      const moduleData = this.moduleDataMap.get(name)
      assert(moduleData, '[require] module not declared', name)
      return moduleData
    }
    this.getModule = (name) => {
      const moduleData = this.moduleDataMap.get(name)
      return moduleData ? moduleData.module : null
    }
    this.setModule = (name, module) => {
      const moduleData = this.moduleDataMap.get(name)
      assert(moduleData, '[setModule] module not declared', name, module)
      moduleData.module = module
    }
  }

  declare (name, type) {
    assert(name, '[declare] error declare nameless module')
    const moduleData = this.moduleDataMap.get(name)
    if (moduleData) {
      assert(type === moduleData.type, '[declare] re-declare failed, type mismatch')
      log('[declare] re-declare', name, type)
    }
    this.moduleDataMap.set(name, { name, type, require: [], loadFunction: null, module: null })
  }

  implement (name, loadFunction) {
    this.getModuleData(name).loadFunction = loadFunction
  }

  require (name, requiredName) {
    this.getModuleData(name).require.push(requiredName)
  }

  load (name) {
    const moduleData = this.getModuleData(name)
    assert(typeof (moduleData.loadFunction) === 'function', '[load] missing module implement func', moduleData.loadFunction, 'for loading module', name)
    if (moduleData.module) return true
    if (!moduleData.require.every(this.getModule)) return false// missing require
    try {
      this.setModule(name, moduleData.loadFunction(GLOBAL, this.getModule))
      return true
    } catch (error) {
      warn('[load] error', error)
      return false
    }
  }

  loadAll () {
    const failedNameList = []
    let lastFailedCount = 'init'
    while (failedNameList.length !== 0) {
      lastFailedCount = failedNameList.length
      failedNameList.length = 0
      this.moduleDataMap.forEach((moduleData, name) => moduleData.module || this.load(name) || failedNameList.push(name))
      assert(lastFailedCount !== failedNameList.length, '[loadAll] infinite loop load?', failedNameList)
    }
  }

  get (name) {
    const module = this.getModule(name)
    assert(module, '[get] module not ready', name)
    return module
  }
}
