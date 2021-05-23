const { resolve } = require('path')
const { promises: fsAsync } = require('fs')
const { createFileWatcher } = require('../../output-gitignore/library/node/file/Watch')
const { createDirectory } = require('../../output-gitignore/library/node/file/Directory')
const { modifyDeleteForce } = require('../../output-gitignore/library/node/file/Modify')

const TEMP_PATH = resolve(__dirname, 'file-watcher-gitignore')

const main = async () => {
  const { setup, subscribe } = createFileWatcher({ persistent: true })
  subscribe(() => console.log('>> [subscribe called] <<'))

  await modifyDeleteForce(TEMP_PATH)
  await createDirectory(resolve(TEMP_PATH, 'a/b/c/d/e'))
  await fsAsync.writeFile(resolve(TEMP_PATH, 'a/file'), 'FILE')
  await fsAsync.writeFile(resolve(TEMP_PATH, 'a/b/file'), 'FILE')
  await fsAsync.writeFile(resolve(TEMP_PATH, 'a/b/c/file'), 'FILE')
  await fsAsync.writeFile(resolve(TEMP_PATH, 'a/b/c/d/file'), 'FILE')
  await fsAsync.writeFile(resolve(TEMP_PATH, 'a/b/c/d/e/file'), 'FILE')

  await setup(resolve(TEMP_PATH, 'a/b'))
  // await setup(resolve(TEMP_PATH, 'a/b/file'))

  // un-comment to test if will log [subscribe called]

  // await renameAsync(resolve(TEMP_PATH, 'a/b'), resolve(TEMP_PATH, 'a/b-rename'))
  // await renameAsync(resolve(TEMP_PATH, 'a/b/c'), resolve(TEMP_PATH, 'a/b/c-rename'))

  await fsAsync.writeFile(resolve(TEMP_PATH, 'a/b/file-add'), 'FILE-ADDED')

  // await fsAsync.writeFile(resolve(TEMP_PATH, 'a/file'), 'FILE-CHANGED')
  // await fsAsync.writeFile(resolve(TEMP_PATH, 'a/b/file'), 'FILE-CHANGED')
  // await fsAsync.writeFile(resolve(TEMP_PATH, 'a/b/c/file'), 'FILE-CHANGED')
  // await fsAsync.writeFile(resolve(TEMP_PATH, 'a/b/c/d/file'), 'FILE-CHANGED')
  // await fsAsync.writeFile(resolve(TEMP_PATH, 'a/b/c/d/e/file'), 'FILE-CHANGED')
}

main().catch(console.error)
