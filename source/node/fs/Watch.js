import { dirname } from 'node:path'
import { watch, promises as fsAsync } from 'node:fs'
import { throttleT } from 'source/common/function.js'
import { createHub } from 'source/common/module/Event.js'
import { nearestExistPath } from './Path.js'

// single node only: a file, or one level of directory
// will throttle event
// listener should check the file for actual file change
// - can watch a non-exist file
// - watch will resume when deleted file is recreated

// TODO:
//   upper directory renaming will not trigger change (still the same stat for this node & upper node)
//   so renaming then replace the path will not trigger change

// NOTE:
//   macos seems to queue up fs changes, so the throttle may be off a bit

const CHANGE_PATH = 'rename' // const CHANGE_CONTENT = 'change'

const EMPTY_FUNC = () => {}

const createFileWatcherExot = ({
  path,
  wait = 250, // TODO: maybe throttle should be done outside, so this only emit raw event
  // set true to keep process from exiting, like `timeout.ref()`
  // once set, should call clear for process to unref and exit
  persistent = false,
  id = 'exot:file-watcher'
}) => {
  const hub = createHub()

  let prevStat

  let watcherPath // the nearest existing path, may be upper path
  let watcherStat
  let watcher
  let watcherUpper

  const emitThrottled = throttleT(async () => {
    // hasChange: true = path level change = create/delete(also for rename since this watches single node)
    // hasChange: false = content level change = path-change/file-content/directory-file-list
    const stat = await fsAsync.lstat(path).catch(EMPTY_FUNC)
    const hasChange = Boolean(prevStat) !== Boolean(stat) // TODO: consider rename to `hasPathChange`?
    __DEV__ && console.log('emitThrottled', hasChange, Boolean(prevStat), Boolean(stat))

    if (stat === undefined) { // target file not found
      if (path === watcherPath) await setupWatch() // renamed, not the target any more

      __DEV__ && hasChange === false && console.log('emitThrottled dropped')
      if (hasChange === false) return
    }

    __DEV__ && console.log('emitThrottled send')
    const changeState = { path, stat, hasChange }
    prevStat = stat
    hub.send(changeState)
  }, wait)

  const onErrorEvent = async (...args) => {
    __DEV__ && console.log('[onErrorEvent]', args)
    await setupWatch()
    onChangeEvent(CHANGE_PATH)
  }
  const onChangeEvent = (changeType, path) => {
    __DEV__ && console.log('[onChangeEvent]', changeType, path)
    emitThrottled(/* changeType, path */)
  }

  const clearWatch = () => {
    watcher && watcher.close()
    watcherUpper && watcherUpper.close()
    watcherPath = undefined
    watcherStat = undefined
    watcher = undefined
    watcherUpper = undefined
  }

  const setupWatch = async () => {
    const stat = await fsAsync.lstat(path).catch(EMPTY_FUNC)

    if (stat) {
      clearWatch()
      __DEV__ && console.log('[Watch] path visible', path, stat.isDirectory())

      watcherPath = path
      watcherStat = stat
      watcher = watch(path, { persistent, recursive: false })
      watcher.addListener('error', onErrorEvent)
      watcher.addListener('change', onChangeEvent)

      // TODO: directly watch directory will miss rename, upper will receive content change, but upper will not receive add/delete change
      if (stat.isDirectory()) {
        watcherUpper = watch(dirname(path))
        watcherUpper.addListener('error', EMPTY_FUNC) // not care this error
        watcherUpper.addListener('change', onChangeEvent)
      }
    } else {
      __DEV__ && console.log('[Watch] path invisible')
      const pathNearest = await nearestExistPath(path)
      if (pathNearest === watcherPath) return // same nearest path
      clearWatch()
      __DEV__ && console.log(`[Watch] change pathNearest: ${pathNearest}`)

      watcherPath = pathNearest
      watcherStat = stat
      watcher = watch(pathNearest, { persistent, recursive: false })
      watcher.addListener('error', onErrorEvent)
      watcher.addListener('change', onErrorEvent)
    }
  }

  return {
    id,
    up: async (onExotError) => {
      await setupWatch()
      prevStat = watcherPath === path ? watcherStat : undefined
    },
    down: () => { // NOTE: this is sync
      clearWatch()
      hub.clear()
      prevStat = undefined
    },
    isUp: () => watcher !== undefined,

    subscribe: (listener) => hub.subscribe(listener),
    unsubscribe: (listener) => hub.unsubscribe(listener)
  }
}

export { createFileWatcherExot }
