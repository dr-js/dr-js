import { dirname } from 'path'
import { watch } from 'fs'
import { throttle } from 'source/common/function'
import { createHub } from 'source/common/module/Event'
import { statAsync } from './function'
import { nearestExistPath } from './Path'

// single node only: a file, or one level of directory
// will throttle event
// listener should check the file for actual file change
// - can watch a non-exist file
// - watch will resume when deleted file is recreated

// TODO: upper directory renaming will not trigger change (still the same stat for this node & upper node)
// TODO: so renaming then replace the path will not trigger change

const CHANGE_PATH = 'rename' // const CHANGE_CONTENT = 'change'

const getNull = () => null

const createFileWatcher = ({
  wait = 250,
  // set true to keep process from exiting, like `timeout.ref()`
  // once set, should call clear for process to unref and exit
  persistent = false
}) => {
  const hub = createHub()

  let watcherPath // the nearest existing path, may be upper path
  let watcherPathStat
  let watcher
  let watcherUpper

  let targetPath
  let prevTargetStat

  const emitThrottled = throttle(async () => {
    // path change: create/delete(also for rename since this watches single node)
    // content change: path-change/file-content/directory-file-list
    const targetStat = await statAsync(targetPath).catch(getNull)
    const isPathChange = Boolean(prevTargetStat) !== Boolean(targetStat)

    if (!targetStat && targetPath === watcherPath) await setupWatch() // renamed, not the target any more

    __DEV__ && !isPathChange && !targetStat && console.log(`emitThrottled dropped`, isPathChange, Boolean(prevTargetStat), Boolean(targetStat))
    if (!isPathChange && !targetStat) return

    __DEV__ && console.log(`emitThrottled send`, isPathChange, Boolean(prevTargetStat), Boolean(targetStat))
    const changeState = { targetPath, isPathChange, targetStat }
    prevTargetStat = targetStat
    hub.send(changeState)
  }, wait)

  const onErrorEvent = async (...args) => {
    __DEV__ && console.log(`[onErrorEvent]`, args)
    await setupWatch()
    onChangeEvent(CHANGE_PATH)
  }
  const onChangeEvent = (changeType, path) => {
    __DEV__ && console.log(`[onChangeEvent]`, changeType, path)
    emitThrottled(changeType, path)
  }

  const clearWatch = () => {
    watcher && watcher.close()
    watcherUpper && watcherUpper.close()
    watcherPath = null
    watcherPathStat = null
    watcher = null
    watcherUpper = null
  }

  const setupWatch = async () => {
    const targetStat = await statAsync(targetPath).catch(getNull)

    if (targetStat) {
      clearWatch()
      __DEV__ && console.log(`[Watch] targetPath visible`, targetPath, targetStat.isDirectory())

      watcherPath = targetPath
      watcherPathStat = targetStat
      watcher = watch(targetPath, { persistent, recursive: false })
      watcher.addListener('error', onErrorEvent)
      watcher.addListener('change', onChangeEvent)

      // TODO: directly watch directory will miss rename, upper will receive content change, but upper will not receive add/delete change
      if (targetStat.isDirectory()) {
        watcherUpper = watch(dirname(targetPath))
        watcherUpper.addListener('error', getNull) // not care this error
        watcherUpper.addListener('change', onChangeEvent)
      }
    } else {
      __DEV__ && console.log(`[Watch] targetPath invisible`)
      const nearestPath = await nearestExistPath(targetPath)
      if (nearestPath === watcherPath) return // same nearest path
      clearWatch()
      __DEV__ && console.log(`[Watch] change nearestPath: ${nearestPath}`)

      watcherPath = nearestPath
      watcherPathStat = targetStat
      watcher = watch(nearestPath, { persistent, recursive: false })
      watcher.addListener('error', onErrorEvent)
      watcher.addListener('change', onErrorEvent)
    }
  }

  return {
    clear: () => {
      clearWatch()
      hub.clear()
      prevTargetStat = null
    },
    setup: async (path) => {
      clearWatch()
      targetPath = path
      __DEV__ && console.log('[setup]', path)
      await setupWatch()
      prevTargetStat = watcherPath === targetPath ? watcherPathStat : null
    },
    subscribe: (listener) => hub.subscribe(listener),
    unsubscribe: (listener) => hub.unsubscribe(listener)
  }
}

export { createFileWatcher }
