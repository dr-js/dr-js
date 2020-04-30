import { resolve } from 'path'
import { promises as fsAsync } from 'fs'
import { stringifyEqual } from 'source/common/verify'
import { setTimeoutAsync } from 'source/common/time'
import { catchAsync } from 'source/common/error'
import { createDirectory } from './Directory'
import { modifyDelete } from './Modify'
import { createFileWatcher } from './Watch'

const { describe, it, after, info = console.log } = global

const TEST_ROOT = resolve(__dirname, './test-watch-gitignore/')

// TODO: Strange timer mix-up, throttle not working & 2nd fs change event not fired till timer is called
// TODO: try change code to `setTimeoutAsync(1000)` and `createFileWatcher({ wait: 500 })` to see the event being blocked & delayed

const createWatcherTest = (tag, func) => async () => {
  const fromTest = (...args) => resolve(TEST_ROOT, tag, ...args)
  const watcher = createFileWatcher({ wait: 10 })

  await createDirectory(fromTest('folder'))
  await fsAsync.writeFile(fromTest('file'), `${tag}|file`)
  await fsAsync.writeFile(fromTest('folder/folder-file'), `${tag}|folder-file`)

  const { error } = await catchAsync(func, { fromTest, watcher })
  watcher.clear()
  if (error) throw error
}

after('clear', async () => {
  await modifyDelete(TEST_ROOT)
})

describe('Node.File.Watch', () => {
  describe('createFileWatcher()', () => {
    it('file content change', createWatcherTest('file-content', async ({ fromTest, watcher }) => {
      const targetPath = fromTest('file')
      let resultChangeState = null

      watcher.subscribe(({ targetPath, isPathChange, targetStat }) => {
        resultChangeState && info('[WARN] unexpected extra emit')
        resultChangeState = { targetPath, isPathChange, hasTargetStat: Boolean(targetStat) }
      })
      await watcher.setup(targetPath)

      await fsAsync.writeFile(targetPath, 'file|changed')
      await setTimeoutAsync(40)
      stringifyEqual(resultChangeState, { targetPath, isPathChange: false, hasTargetStat: true })
    }))

    it('directory content change', createWatcherTest('directory-content', async ({ fromTest, watcher }) => {
      const targetPath = fromTest('folder')
      let resultChangeState = null

      watcher.subscribe(({ targetPath, isPathChange, targetStat }) => {
        resultChangeState && info('[WARN] unexpected extra emit')
        resultChangeState = { targetPath, isPathChange, hasTargetStat: Boolean(targetStat) }
      })
      await watcher.setup(targetPath)

      await fsAsync.writeFile(fromTest('folder/add-file'), 'file|added')
      await setTimeoutAsync(40)
      stringifyEqual(resultChangeState, { targetPath, isPathChange: false, hasTargetStat: true })

      resultChangeState = null
      await fsAsync.writeFile(fromTest('folder/add-file'), 'file|added')
      await fsAsync.rename(fromTest('folder/add-file'), fromTest('folder/rename-add-file'))
      await setTimeoutAsync(40)
      stringifyEqual(resultChangeState, { targetPath, isPathChange: false, hasTargetStat: true })
    }))

    it('file name change', createWatcherTest('file-name', async ({ fromTest, watcher }) => {
      const targetPath = fromTest('file')
      let resultChangeState = null

      watcher.subscribe(({ targetPath, isPathChange, targetStat }) => {
        resultChangeState && info('[WARN] unexpected extra emit')
        resultChangeState = { targetPath, isPathChange, hasTargetStat: Boolean(targetStat) }
      })
      await watcher.setup(targetPath)

      await fsAsync.rename(fromTest('file'), fromTest('rename-file'))

      await setTimeoutAsync(40)
      stringifyEqual(resultChangeState, { targetPath, isPathChange: true, hasTargetStat: false })
    }))

    it('directory name change', createWatcherTest('directory-name', async ({ fromTest, watcher }) => {
      const targetPath = fromTest('folder')
      let resultChangeState = null

      watcher.subscribe(({ targetPath, isPathChange, targetStat }) => {
        resultChangeState && info('[WARN] unexpected extra emit')
        resultChangeState = { targetPath, isPathChange, hasTargetStat: Boolean(targetStat) }
      })
      await watcher.setup(targetPath)

      await fsAsync.rename(fromTest('folder'), fromTest('rename-folder'))
      await setTimeoutAsync(40)
      stringifyEqual(resultChangeState, { targetPath, isPathChange: true, hasTargetStat: false })
    }))

    it('file delete change', createWatcherTest('file-delete', async ({ fromTest, watcher }) => {
      const targetPath = fromTest('file')
      let resultChangeState = null

      watcher.subscribe(({ targetPath, isPathChange, targetStat }) => {
        resultChangeState && info('[WARN] unexpected extra emit')
        resultChangeState = { targetPath, isPathChange, hasTargetStat: Boolean(targetStat) }
      })
      await watcher.setup(targetPath)

      await modifyDelete(fromTest('file'))
      await setTimeoutAsync(40)
      stringifyEqual(resultChangeState, { targetPath, isPathChange: true, hasTargetStat: false })
    }))

    it('directory delete change', createWatcherTest('directory-delete', async ({ fromTest, watcher }) => {
      const targetPath = fromTest('folder')
      let resultChangeState = null

      watcher.subscribe(({ targetPath, isPathChange, targetStat }) => {
        resultChangeState && info('[WARN] unexpected extra emit')
        resultChangeState = { targetPath, isPathChange, hasTargetStat: Boolean(targetStat) }
      })
      await watcher.setup(targetPath)

      await modifyDelete(fromTest('folder/folder-file'))
      await setTimeoutAsync(40)
      stringifyEqual(resultChangeState, { targetPath, isPathChange: false, hasTargetStat: true })

      resultChangeState = null
      await modifyDelete(fromTest('folder'))
      await setTimeoutAsync(40)
      stringifyEqual(resultChangeState, { targetPath, isPathChange: true, hasTargetStat: false })
    }))

    it('file rename change (not upper node)', createWatcherTest('file-rename', async ({ fromTest, watcher }) => {
      const targetPath = fromTest('file')
      let resultChangeState = null

      watcher.subscribe(({ targetPath, isPathChange, targetStat }) => {
        resultChangeState && info('[WARN] unexpected extra emit')
        resultChangeState = { targetPath, isPathChange, hasTargetStat: Boolean(targetStat) }
      })
      await watcher.setup(targetPath)

      await fsAsync.rename(fromTest('file'), fromTest('file-folder'))
      await setTimeoutAsync(40)
      stringifyEqual(resultChangeState, { targetPath, isPathChange: true, hasTargetStat: false })
    }))

    it('directory rename change (not upper node)', createWatcherTest('directory-rename', async ({ fromTest, watcher }) => {
      const targetPath = fromTest('folder')
      let resultChangeState = null

      watcher.subscribe(({ targetPath, isPathChange, targetStat }) => {
        resultChangeState && info('[WARN] unexpected extra emit')
        resultChangeState = { targetPath, isPathChange, hasTargetStat: Boolean(targetStat) }
      })
      await watcher.setup(targetPath)

      await fsAsync.rename(fromTest('folder'), fromTest('rename-folder'))
      await setTimeoutAsync(40)
      stringifyEqual(resultChangeState, { targetPath, isPathChange: true, hasTargetStat: false })
    }))

    it('file watch pre path create', createWatcherTest('file-watch-pre-create', async ({ fromTest, watcher }) => {
      const targetPath = fromTest('file')
      let resultChangeState = null

      await modifyDelete(targetPath)

      watcher.subscribe(({ targetPath, isPathChange, targetStat }) => {
        resultChangeState && info('[WARN] unexpected extra emit')
        resultChangeState = { targetPath, isPathChange, hasTargetStat: Boolean(targetStat) }
      })
      await watcher.setup(targetPath)

      await fsAsync.writeFile(targetPath, 'file|created')
      await setTimeoutAsync(40)
      stringifyEqual(resultChangeState, { targetPath, isPathChange: true, hasTargetStat: true })
    }))

    it('directory watch pre path create', createWatcherTest('directory-watch-pre-create', async ({ fromTest, watcher }) => {
      const targetPath = fromTest('folder')
      let resultChangeState = null

      await modifyDelete(targetPath)

      watcher.subscribe(({ targetPath, isPathChange, targetStat }) => {
        resultChangeState && info('[WARN] unexpected extra emit')
        resultChangeState = { targetPath, isPathChange, hasTargetStat: Boolean(targetStat) }
      })
      await watcher.setup(targetPath)

      await fsAsync.mkdir(targetPath)
      await setTimeoutAsync(40)
      stringifyEqual(resultChangeState, { targetPath, isPathChange: true, hasTargetStat: true })
    }))

    it('file watch delete and recreate', createWatcherTest('file-watch-delete-create', async ({ fromTest, watcher }) => {
      const targetPath = fromTest('file')
      let resultChangeState = null

      watcher.subscribe(({ targetPath, isPathChange, targetStat }) => {
        resultChangeState && info('[WARN] unexpected extra emit')
        resultChangeState = { targetPath, isPathChange, hasTargetStat: Boolean(targetStat) }
      })
      await watcher.setup(targetPath)

      await modifyDelete(targetPath)
      await setTimeoutAsync(40)
      stringifyEqual(resultChangeState, { targetPath, isPathChange: true, hasTargetStat: false })

      resultChangeState = null
      await fsAsync.writeFile(targetPath, 'file|recreated')
      await setTimeoutAsync(40)
      stringifyEqual(resultChangeState, { targetPath, isPathChange: true, hasTargetStat: true })
    }))

    it('directory watch delete and recreate', createWatcherTest('directory-watch-delete-create', async ({ fromTest, watcher }) => {
      const targetPath = fromTest('folder')
      let resultChangeState = null

      watcher.subscribe(({ targetPath, isPathChange, targetStat }) => {
        resultChangeState && info('[WARN] unexpected extra emit')
        resultChangeState = { targetPath, isPathChange, hasTargetStat: Boolean(targetStat) }
      })
      await watcher.setup(targetPath)

      await modifyDelete(targetPath)
      await setTimeoutAsync(40)
      stringifyEqual(resultChangeState, { targetPath, isPathChange: true, hasTargetStat: false })

      resultChangeState = null
      await fsAsync.mkdir(targetPath)
      await setTimeoutAsync(40)
      stringifyEqual(resultChangeState, { targetPath, isPathChange: true, hasTargetStat: true })
    }))
  })
})
