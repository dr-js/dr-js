import { resolve } from 'path'
import { deepStrictEqual } from 'assert'
import { writeFileAsync, renameAsync, mkdirAsync } from './function'

import { createFileWatcher } from './Watch'
import { createDirectory } from './File'
import { modify } from './Modify'
import { setTimeoutAsync } from 'source/common/time'
import { catchAsync } from 'source/common/error'

const { describe, it, after } = global

const TEST_ROOT = resolve(__dirname, './test-watch-gitignore/')

// TODO: Strange timer mix-up, throttle not working & 2nd fs change event not fired till timer is called
// TODO: try change code to `setTimeoutAsync(1000)` and `createFileWatcher({ wait: 500 })` to see the event being blocked & delayed

const createWatcherTest = (tag, func) => async () => {
  const fromTest = (...args) => resolve(TEST_ROOT, tag, ...args)
  const watcher = createFileWatcher({ wait: 10 })

  await createDirectory(fromTest('folder'))
  await writeFileAsync(fromTest('file'), `${tag}|file`)
  await writeFileAsync(fromTest('folder/folder-file'), `${tag}|folder-file`)

  const { error } = await catchAsync(func, { fromTest, watcher })
  watcher.clear()
  if (error) throw error
}

after('clear', async () => {
  await modify.delete(TEST_ROOT)
})

describe('Node.File.Watch', () => {
  describe('createFileWatcher()', () => {
    it('file content change', createWatcherTest('file-content', async ({ fromTest, watcher }) => {
      const targetPath = fromTest('file')
      let resultChangeState = null

      watcher.subscribe(({ targetPath, isPathChange, targetStat }) => {
        if (resultChangeState) console.warn('unexpected extra emit')
        resultChangeState = { targetPath, isPathChange, hasTargetStat: Boolean(targetStat) }
      })
      await watcher.setup(targetPath)

      await writeFileAsync(targetPath, `file|changed`)
      await setTimeoutAsync(40)
      deepStrictEqual(resultChangeState, { targetPath, isPathChange: false, hasTargetStat: true })
    }))

    it('directory content change', createWatcherTest('directory-content', async ({ fromTest, watcher }) => {
      const targetPath = fromTest('folder')
      let resultChangeState = null

      watcher.subscribe(({ targetPath, isPathChange, targetStat }) => {
        if (resultChangeState) console.warn('unexpected extra emit')
        resultChangeState = { targetPath, isPathChange, hasTargetStat: Boolean(targetStat) }
      })
      await watcher.setup(targetPath)

      await writeFileAsync(fromTest('folder/add-file'), `file|added`)
      await setTimeoutAsync(40)
      deepStrictEqual(resultChangeState, { targetPath, isPathChange: false, hasTargetStat: true })

      resultChangeState = null
      await writeFileAsync(fromTest('folder/add-file'), `file|added`)
      await renameAsync(fromTest('folder/add-file'), fromTest('folder/rename-add-file'))
      await setTimeoutAsync(40)
      deepStrictEqual(resultChangeState, { targetPath, isPathChange: false, hasTargetStat: true })
    }))

    it('file name change', createWatcherTest('file-name', async ({ fromTest, watcher }) => {
      const targetPath = fromTest('file')
      let resultChangeState = null

      watcher.subscribe(({ targetPath, isPathChange, targetStat }) => {
        if (resultChangeState) console.warn('unexpected extra emit')
        resultChangeState = { targetPath, isPathChange, hasTargetStat: Boolean(targetStat) }
      })
      await watcher.setup(targetPath)

      await renameAsync(fromTest('file'), fromTest('rename-file'))
      await setTimeoutAsync(40)
      deepStrictEqual(resultChangeState, { targetPath, isPathChange: true, hasTargetStat: false })
    }))

    it('directory name change', createWatcherTest('directory-name', async ({ fromTest, watcher }) => {
      const targetPath = fromTest('folder')
      let resultChangeState = null

      watcher.subscribe(({ targetPath, isPathChange, targetStat }) => {
        if (resultChangeState) console.warn('unexpected extra emit')
        resultChangeState = { targetPath, isPathChange, hasTargetStat: Boolean(targetStat) }
      })
      await watcher.setup(targetPath)

      await renameAsync(fromTest('folder'), fromTest('rename-folder'))
      await setTimeoutAsync(40)
      deepStrictEqual(resultChangeState, { targetPath, isPathChange: true, hasTargetStat: false })
    }))

    it('file delete change', createWatcherTest('file-delete', async ({ fromTest, watcher }) => {
      const targetPath = fromTest('file')
      let resultChangeState = null

      watcher.subscribe(({ targetPath, isPathChange, targetStat }) => {
        if (resultChangeState) console.warn('unexpected extra emit')
        resultChangeState = { targetPath, isPathChange, hasTargetStat: Boolean(targetStat) }
      })
      await watcher.setup(targetPath)

      await modify.delete(fromTest('file'))
      await setTimeoutAsync(40)
      deepStrictEqual(resultChangeState, { targetPath, isPathChange: true, hasTargetStat: false })
    }))

    it('directory delete change', createWatcherTest('directory-delete', async ({ fromTest, watcher }) => {
      const targetPath = fromTest('folder')
      let resultChangeState = null

      watcher.subscribe(({ targetPath, isPathChange, targetStat }) => {
        if (resultChangeState) console.warn('unexpected extra emit')
        resultChangeState = { targetPath, isPathChange, hasTargetStat: Boolean(targetStat) }
      })
      await watcher.setup(targetPath)

      await modify.delete(fromTest('folder/folder-file'))
      await setTimeoutAsync(40)
      deepStrictEqual(resultChangeState, { targetPath, isPathChange: false, hasTargetStat: true })

      resultChangeState = null
      await modify.delete(fromTest('folder'))
      await setTimeoutAsync(40)
      deepStrictEqual(resultChangeState, { targetPath, isPathChange: true, hasTargetStat: false })
    }))

    it('file move change (not upper node)', createWatcherTest('file-move', async ({ fromTest, watcher }) => {
      const targetPath = fromTest('file')
      let resultChangeState = null

      watcher.subscribe(({ targetPath, isPathChange, targetStat }) => {
        if (resultChangeState) console.warn('unexpected extra emit')
        resultChangeState = { targetPath, isPathChange, hasTargetStat: Boolean(targetStat) }
      })
      await watcher.setup(targetPath)

      await renameAsync(fromTest('file'), fromTest('file-folder'))
      await setTimeoutAsync(40)
      deepStrictEqual(resultChangeState, { targetPath, isPathChange: true, hasTargetStat: false })
    }))

    it('directory move change (not upper node)', createWatcherTest('directory-move', async ({ fromTest, watcher }) => {
      const targetPath = fromTest('folder')
      let resultChangeState = null

      watcher.subscribe(({ targetPath, isPathChange, targetStat }) => {
        if (resultChangeState) console.warn('unexpected extra emit')
        resultChangeState = { targetPath, isPathChange, hasTargetStat: Boolean(targetStat) }
      })
      await watcher.setup(targetPath)

      await renameAsync(fromTest('folder'), fromTest('rename-folder'))
      await setTimeoutAsync(40)
      deepStrictEqual(resultChangeState, { targetPath, isPathChange: true, hasTargetStat: false })
    }))

    it('file watch pre path create', createWatcherTest('file-watch-pre-create', async ({ fromTest, watcher }) => {
      const targetPath = fromTest('file')
      let resultChangeState = null

      await modify.delete(targetPath)

      watcher.subscribe(({ targetPath, isPathChange, targetStat }) => {
        if (resultChangeState) console.warn('unexpected extra emit')
        resultChangeState = { targetPath, isPathChange, hasTargetStat: Boolean(targetStat) }
      })
      await watcher.setup(targetPath)

      await writeFileAsync(targetPath, `file|created`)
      await setTimeoutAsync(40)
      deepStrictEqual(resultChangeState, { targetPath, isPathChange: true, hasTargetStat: true })
    }))

    it('directory watch pre path create', createWatcherTest('directory-watch-pre-create', async ({ fromTest, watcher }) => {
      const targetPath = fromTest('folder')
      let resultChangeState = null

      await modify.delete(targetPath)

      watcher.subscribe(({ targetPath, isPathChange, targetStat }) => {
        if (resultChangeState) console.warn('unexpected extra emit')
        resultChangeState = { targetPath, isPathChange, hasTargetStat: Boolean(targetStat) }
      })
      await watcher.setup(targetPath)

      await mkdirAsync(targetPath)
      await setTimeoutAsync(40)
      deepStrictEqual(resultChangeState, { targetPath, isPathChange: true, hasTargetStat: true })
    }))

    it('file watch delete and recreate', createWatcherTest('file-watch-delete-create', async ({ fromTest, watcher }) => {
      const targetPath = fromTest('file')
      let resultChangeState = null

      watcher.subscribe(({ targetPath, isPathChange, targetStat }) => {
        if (resultChangeState) console.warn('unexpected extra emit')
        resultChangeState = { targetPath, isPathChange, hasTargetStat: Boolean(targetStat) }
      })
      await watcher.setup(targetPath)

      await modify.delete(targetPath)
      await setTimeoutAsync(40)
      deepStrictEqual(resultChangeState, { targetPath, isPathChange: true, hasTargetStat: false })

      resultChangeState = null
      await writeFileAsync(targetPath, `file|recreated`)
      await setTimeoutAsync(40)
      deepStrictEqual(resultChangeState, { targetPath, isPathChange: true, hasTargetStat: true })
    }))

    it('directory watch delete and recreate', createWatcherTest('directory-watch-delete-create', async ({ fromTest, watcher }) => {
      const targetPath = fromTest('folder')
      let resultChangeState = null

      watcher.subscribe(({ targetPath, isPathChange, targetStat }) => {
        if (resultChangeState) console.warn('unexpected extra emit')
        resultChangeState = { targetPath, isPathChange, hasTargetStat: Boolean(targetStat) }
      })
      await watcher.setup(targetPath)

      await modify.delete(targetPath)
      await setTimeoutAsync(40)
      deepStrictEqual(resultChangeState, { targetPath, isPathChange: true, hasTargetStat: false })

      resultChangeState = null
      await mkdirAsync(targetPath)
      await setTimeoutAsync(40)
      deepStrictEqual(resultChangeState, { targetPath, isPathChange: true, hasTargetStat: true })
    }))
  })
})
