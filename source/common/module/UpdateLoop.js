import { now, onNextProperUpdate } from 'source/common/time'

// TODO: check if not needed

export class UpdateLoop {
  constructor () {
    this.lastUpdateTime = now()
    this.isActive = false
    this.clear()
    // bind first
    this.update = this.update.bind(this)
  }

  start () {
    this.isActive = true
    onNextProperUpdate(this.update)
  }

  stop () {
    this.isActive = false
  }

  clear () {
    this.updateFuncList = [] // index non-constant, will be refreshed on every update
    this.updateFuncMap = new Map() // key constant, will be refreshed on every update
  }

  add (updateFunc, key) {
    key ? this.updateFuncMap.set(key, updateFunc) : this.updateFuncList.push(updateFunc)
  }

  update () {
    const currentUpdateTime = now()
    const deltaTime = currentUpdateTime - this.lastUpdateTime
    this.lastUpdateTime = currentUpdateTime

    const nextUpdateFuncList = []
    this.updateFuncList.forEach((updateFunc) => updateFunc(deltaTime) && nextUpdateFuncList.push(updateFunc))
    this.updateFuncList = nextUpdateFuncList

    const nextUpdateFuncMap = new Map()
    this.updateFuncMap.forEach((updateFunc, key) => updateFunc(deltaTime) && nextUpdateFuncMap.set(key, updateFunc))
    this.updateFuncMap = nextUpdateFuncMap

    this.isActive && onNextProperUpdate(this.update)
  }
}
