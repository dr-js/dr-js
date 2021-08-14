import { resolve, relative } from 'path'
import { promises as fsAsync } from 'fs'
import { strictEqual, stringifyEqual, truthy } from 'source/common/verify.js'
import { compareString } from 'source/common/compare.js'
import { PATH_TYPE, getPathLstat, toPosixPath } from 'source/node/fs/Path.js'
import { createDirectory, getDirInfoTree, resetDirectory } from 'source/node/fs/Directory.js'
import { modifyDelete } from 'source/node/fs/Modify.js'

const TEST_ROOT = resolve(__dirname, 'test-root-gitignore/')
const fromRoot = (...args) => resolve(TEST_ROOT, ...args)

const SOURCE_DIRECTORY = fromRoot('source-directory/')

// https://nodejs.org/api/process.html#process_process_umask_mask
// http://man7.org/linux/man-pages/man2/umask.2.html
const PROCESS_UMASK = process.umask(0) // read umask (win32 will be 0)
process.umask(PROCESS_UMASK) // restore umask

// For file type and mode, check: https://man7.org/linux/man-pages/man7/inode.7.html

const setupRoot = async (isSkipMode600 = false) => {
  await resetDirectory(TEST_ROOT)

  await createDirectory(fromRoot(SOURCE_DIRECTORY, '1/2/3/4/5'))
  await fsAsync.writeFile(fromRoot(SOURCE_DIRECTORY, 'file-empty'), '')
  await fsAsync.writeFile(fromRoot(SOURCE_DIRECTORY, 'file.js'), EXPECT_FILE_CONTENT)

  if (process.platform !== 'win32') {
    !isSkipMode600 && await fsAsync.writeFile(fromRoot(SOURCE_DIRECTORY, 'file-mode-600'), '', { mode: 0o600 })
    await fsAsync.writeFile(fromRoot(SOURCE_DIRECTORY, 'file-mode-644'), '', { mode: 0o644 })
    await fsAsync.writeFile(fromRoot(SOURCE_DIRECTORY, 'file-mode-755'), '', { mode: 0o755 })

    // symlink don't have a permission itself, it's read and set to the target file
    !isSkipMode600 && await fsAsync.symlink('./file-mode-600', fromRoot(SOURCE_DIRECTORY, 'link-to-file-mode-600'))
    await fsAsync.symlink('./file-mode-644', fromRoot(SOURCE_DIRECTORY, 'link-to-file-mode-644'))
    await fsAsync.symlink('./file-mode-755', fromRoot(SOURCE_DIRECTORY, 'link-to-file-mode-755'))
    await fsAsync.symlink('./noop', fromRoot(SOURCE_DIRECTORY, 'link-noop'))
  }
}

const clearRoot = async () => {
  await modifyDelete(TEST_ROOT)
}

const EXPECT_FILE_CONTENT = 'console.log([ { 1: 2 } ])\n'.repeat(64)
const verifyOutputDirectory = async (path, isSkipMode600 = false) => {
  const EXPECT_INFO_LIST = [
    [ '', [
      { name: '1', type: 'Directory' },
      { name: 'file-empty', type: 'File', size: 0, mode: 0o100666 & ~PROCESS_UMASK }, // win32 file/directory node stat.mode will be 666
      { name: 'file.js', type: 'File', size: Buffer.byteLength(EXPECT_FILE_CONTENT), mode: 0o100666 & ~PROCESS_UMASK },
      ...(
        process.platform === 'win32' ? [] : [
          !isSkipMode600 && { name: 'file-mode-600', type: 'File', size: 0, mode: 0o100600 },
          { name: 'file-mode-644', type: 'File', size: 0, mode: 0o100644 },
          { name: 'file-mode-755', type: 'File', size: 0, mode: 0o100755 },

          { name: 'link-noop', type: 'Symlink' },
          !isSkipMode600 && { name: 'link-to-file-mode-600', type: 'Symlink' },
          { name: 'link-to-file-mode-644', type: 'Symlink' },
          { name: 'link-to-file-mode-755', type: 'Symlink' }
        ].filter(Boolean))
    ].sort((a, b) => compareString(a.name, b.name)) ],
    [ '1', [ { name: '2', type: 'Directory' } ] ],
    [ '1/2', [ { name: '3', type: 'Directory' } ] ],
    [ '1/2/3', [ { name: '4', type: 'Directory' } ] ],
    [ '1/2/3/4', [ { name: '5', type: 'Directory' } ] ],
    [ '1/2/3/4/5', [] ]
  ]

  const { dirInfoListMap } = await getDirInfoTree(path)
  const infoList = []
  for (const [ key, dirInfoList ] of dirInfoListMap) {
    const contentList = []
    for (const { type, name, path } of dirInfoList) {
      const stat = type === PATH_TYPE.File && await getPathLstat(path)
      contentList.push({ name, type, ...(stat && { size: stat.size, mode: stat.mode }) })
    }
    infoList.push([ toPosixPath(relative(path, key)), contentList.sort((a, b) => compareString(a.name, b.name)) ])
  }
  try { stringifyEqual(infoList, EXPECT_INFO_LIST) } catch (error) {
    console.warn('[WARN|path]', path)
    console.warn('[WARN|get]', infoList.map((v) => JSON.stringify(v)))
    console.warn('[WARN|expect]', EXPECT_INFO_LIST.map((v) => JSON.stringify(v)))
    throw error
  }

  if (process.platform !== 'win32') {
    !isSkipMode600 && strictEqual((await fsAsync.stat(fromRoot(path, 'link-to-file-mode-600'))).mode.toString(8), 0o100600.toString(8))
    strictEqual((await fsAsync.stat(fromRoot(path, 'link-to-file-mode-644'))).mode.toString(8), 0o100644.toString(8))
    strictEqual((await fsAsync.stat(fromRoot(path, 'link-to-file-mode-755'))).mode.toString(8), 0o100755.toString(8))

    // TODO: NOTE: don't check file mode, currently it's 777 for ubuntu, and 755 for darwin
    !isSkipMode600 && truthy((await fsAsync.lstat(fromRoot(path, 'link-to-file-mode-600'))).isSymbolicLink())
    truthy((await fsAsync.lstat(fromRoot(path, 'link-to-file-mode-644'))).isSymbolicLink())
    truthy((await fsAsync.lstat(fromRoot(path, 'link-to-file-mode-755'))).isSymbolicLink())
    truthy((await fsAsync.lstat(fromRoot(path, 'link-noop'))).isSymbolicLink())
  }
}

export {
  fromRoot, setupRoot, clearRoot,
  SOURCE_DIRECTORY, verifyOutputDirectory
}
