import { resolve } from 'path'
import { promises as fsAsync } from 'fs'
import { stringifyEqual } from 'source/common/verify'
import { setTimeoutAsync } from 'source/common/time'
import { catchAsync } from 'source/common/error'
import { createDirectory } from './Directory'
import { modifyDelete } from './Modify'
import { createFileWatcherExot } from './Watch'

const { describe, it, after, info = console.log } = global

const TEST_ROOT = resolve(__dirname, './test-watch-gitignore/')

// TODO: Strange timer mix-up, throttle not working & 2nd fs change event not fired till timer is called
// TODO: try change code to `setTimeoutAsync(1000)` and `createFileWatcher({ wait: 500 })` to see the event being blocked & delayed

const TIME_WAIT_SCALE = process.platform !== 'darwin' ? 1 : 10 // TODO: NOTE: macos fs watcher event seems to be both batched and late than linux/win32, so just wait longer

const createWatcherTest = (tag, path, func) => async () => {
  const fromTest = (...args) => resolve(TEST_ROOT, tag, ...args)

  path = fromTest(path)
  const watcherExot = createFileWatcherExot({ path, wait: 10 * TIME_WAIT_SCALE })

  await createDirectory(fromTest('folder'))
  await fsAsync.writeFile(fromTest('file'), `${tag}|file`)
  await fsAsync.writeFile(fromTest('folder/folder-file'), `${tag}|folder-file`)

  __DEV__ && console.log('[createWatcherTest] pre test')
  const { error } = await catchAsync(func, { fromTest, path, watcherExot })
  __DEV__ && console.log('[createWatcherTest] post test')
  await watcherExot.down() // actually sync
  if (error) throw error
}

after(async () => {
  await modifyDelete(TEST_ROOT)
})

describe('Node.File.Watch', () => {
  describe('createFileWatcher()', () => {
    it('file content change', createWatcherTest('file-content', './file', async ({ fromTest, path, watcherExot }) => {
      let resultChangeState

      watcherExot.subscribe(({ path, stat, hasChange }) => {
        resultChangeState && info('[WARN] unexpected extra emit')
        resultChangeState = { path, hasStat: Boolean(stat), hasChange }
      })
      await watcherExot.up()

      await fsAsync.writeFile(path, 'file|changed')
      await setTimeoutAsync(40 * TIME_WAIT_SCALE)
      stringifyEqual(resultChangeState, { path, hasStat: true, hasChange: false })
    }))

    it('directory content change', createWatcherTest('directory-content', './folder/', async ({ fromTest, path, watcherExot }) => {
      let resultChangeState

      watcherExot.subscribe(({ path, stat, hasChange }) => {
        resultChangeState && info('[WARN] unexpected extra emit')
        resultChangeState = { path, hasStat: Boolean(stat), hasChange }
      })
      await watcherExot.up()
      __DEV__ && console.log('watcherExot.up')

      await fsAsync.writeFile(fromTest('folder/add-file'), 'file|added')
      __DEV__ && console.log('file|added')
      await setTimeoutAsync(40 * TIME_WAIT_SCALE)
      stringifyEqual(resultChangeState, { path, hasStat: true, hasChange: false })

      resultChangeState = undefined
      await fsAsync.writeFile(fromTest('folder/add-file'), 'file|added')
      __DEV__ && console.log('file|added')
      await fsAsync.rename(fromTest('folder/add-file'), fromTest('folder/rename-add-file'))
      __DEV__ && console.log('file|rename')
      await setTimeoutAsync(40 * TIME_WAIT_SCALE)
      stringifyEqual(resultChangeState, { path, hasStat: true, hasChange: false })
    }))

    it('file name change', createWatcherTest('file-name', './file', async ({ fromTest, path, watcherExot }) => {
      let resultChangeState

      watcherExot.subscribe(({ path, stat, hasChange }) => {
        resultChangeState && info('[WARN] unexpected extra emit')
        resultChangeState = { path, hasStat: Boolean(stat), hasChange }
      })
      await watcherExot.up()

      await fsAsync.rename(fromTest('file'), fromTest('rename-file'))

      await setTimeoutAsync(40 * TIME_WAIT_SCALE)
      stringifyEqual(resultChangeState, { path, hasStat: false, hasChange: true })
    }))

    it('directory name change', createWatcherTest('directory-name', './folder/', async ({ fromTest, path, watcherExot }) => {
      let resultChangeState

      watcherExot.subscribe(({ path, stat, hasChange }) => {
        resultChangeState && info('[WARN] unexpected extra emit')
        resultChangeState = { path, hasStat: Boolean(stat), hasChange }
      })
      await watcherExot.up()

      await fsAsync.rename(fromTest('folder'), fromTest('rename-folder'))
      await setTimeoutAsync(40 * TIME_WAIT_SCALE)
      stringifyEqual(resultChangeState, { path, hasStat: false, hasChange: true })
    }))

    it('file delete change', createWatcherTest('file-delete', './file', async ({ fromTest, path, watcherExot }) => {
      let resultChangeState

      watcherExot.subscribe(({ path, stat, hasChange }) => {
        resultChangeState && info('[WARN] unexpected extra emit')
        resultChangeState = { path, hasStat: Boolean(stat), hasChange }
      })
      await watcherExot.up()

      await modifyDelete(fromTest('file'))
      await setTimeoutAsync(40 * TIME_WAIT_SCALE)
      stringifyEqual(resultChangeState, { path, hasStat: false, hasChange: true })
    }))

    it('directory delete change', createWatcherTest('directory-delete', './folder/', async ({ fromTest, path, watcherExot }) => {
      let resultChangeState

      watcherExot.subscribe(({ path, stat, hasChange }) => {
        resultChangeState && info('[WARN] unexpected extra emit')
        resultChangeState = { path, hasStat: Boolean(stat), hasChange }
      })
      await watcherExot.up()

      await modifyDelete(fromTest('folder/folder-file'))
      await setTimeoutAsync(40 * TIME_WAIT_SCALE)
      stringifyEqual(resultChangeState, { path, hasStat: true, hasChange: false })

      resultChangeState = undefined
      await modifyDelete(fromTest('folder'))
      await setTimeoutAsync(40 * TIME_WAIT_SCALE)
      stringifyEqual(resultChangeState, { path, hasStat: false, hasChange: true })
    }))

    it('file rename change (not upper node)', createWatcherTest('file-rename', './file', async ({ fromTest, path, watcherExot }) => {
      let resultChangeState

      watcherExot.subscribe(({ path, stat, hasChange }) => {
        resultChangeState && info('[WARN] unexpected extra emit')
        resultChangeState = { path, hasStat: Boolean(stat), hasChange }
      })
      await watcherExot.up()

      await fsAsync.rename(fromTest('file'), fromTest('file-folder'))
      await setTimeoutAsync(40 * TIME_WAIT_SCALE)
      stringifyEqual(resultChangeState, { path, hasStat: false, hasChange: true })
    }))

    it('directory rename change (not upper node)', createWatcherTest('directory-rename', './folder/', async ({ fromTest, path, watcherExot }) => {
      let resultChangeState

      watcherExot.subscribe(({ path, stat, hasChange }) => {
        resultChangeState && info('[WARN] unexpected extra emit')
        resultChangeState = { path, hasStat: Boolean(stat), hasChange }
      })
      await watcherExot.up()

      await fsAsync.rename(fromTest('folder'), fromTest('rename-folder'))
      await setTimeoutAsync(40 * TIME_WAIT_SCALE)
      stringifyEqual(resultChangeState, { path, hasStat: false, hasChange: true })
    }))

    it('file watch pre path create', createWatcherTest('file-watch-pre-create', './file', async ({ fromTest, path, watcherExot }) => {
      let resultChangeState

      await modifyDelete(path)

      watcherExot.subscribe(({ path, stat, hasChange }) => {
        resultChangeState && info('[WARN] unexpected extra emit')
        resultChangeState = { path, hasStat: Boolean(stat), hasChange }
      })
      await watcherExot.up()

      await fsAsync.writeFile(path, 'file|created')
      await setTimeoutAsync(40 * TIME_WAIT_SCALE)
      stringifyEqual(resultChangeState, { path, hasStat: true, hasChange: true })
    }))

    it('directory watch pre path create', createWatcherTest('directory-watch-pre-create', './folder/', async ({ fromTest, path, watcherExot }) => {
      let resultChangeState

      await modifyDelete(path)

      watcherExot.subscribe(({ path, stat, hasChange }) => {
        resultChangeState && info('[WARN] unexpected extra emit')
        resultChangeState = { path, hasStat: Boolean(stat), hasChange }
      })
      await watcherExot.up()

      await fsAsync.mkdir(path)
      await setTimeoutAsync(40 * TIME_WAIT_SCALE)
      stringifyEqual(resultChangeState, { path, hasStat: true, hasChange: true })
    }))

    it('file watch delete and recreate', createWatcherTest('file-watch-delete-create', './file', async ({ fromTest, path, watcherExot }) => {
      let resultChangeState

      watcherExot.subscribe(({ path, stat, hasChange }) => {
        resultChangeState && info('[WARN] unexpected extra emit')
        resultChangeState = { path, hasStat: Boolean(stat), hasChange }
      })
      await watcherExot.up()

      await modifyDelete(path)
      await setTimeoutAsync(40 * TIME_WAIT_SCALE)
      stringifyEqual(resultChangeState, { path, hasStat: false, hasChange: true })

      resultChangeState = undefined
      await fsAsync.writeFile(path, 'file|recreated')
      await setTimeoutAsync(40 * TIME_WAIT_SCALE)
      stringifyEqual(resultChangeState, { path, hasStat: true, hasChange: true })
    }))

    it('directory watch delete and recreate', createWatcherTest('directory-watch-delete-create', './folder/', async ({ fromTest, path, watcherExot }) => {
      let resultChangeState

      watcherExot.subscribe(({ path, stat, hasChange }) => {
        resultChangeState && info('[WARN] unexpected extra emit')
        resultChangeState = { path, hasStat: Boolean(stat), hasChange }
      })
      await watcherExot.up()

      await modifyDelete(path)
      await setTimeoutAsync(40 * TIME_WAIT_SCALE)
      stringifyEqual(resultChangeState, { path, hasStat: false, hasChange: true })

      resultChangeState = undefined
      await fsAsync.mkdir(path)
      await setTimeoutAsync(40 * TIME_WAIT_SCALE)
      stringifyEqual(resultChangeState, { path, hasStat: true, hasChange: true })
    }))
  })
})
