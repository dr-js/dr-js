import { resolve } from 'path'
import { strictEqual, doThrow } from 'source/common/verify'
import { // TODO: add more test
  statAsync,
  createPathPrefixLock
} from './function'

const { describe, it } = global

describe('Node.File.function', () => {
  it('statAsync()', async () => {
    const statFile = await statAsync(`${__dirname}/function.js`)
    strictEqual(Boolean(statFile), true)
    strictEqual(Boolean(statFile.mode), true, 'file stat should have mode')
    strictEqual(Boolean(statFile.size), true, 'file stat should have size')
    strictEqual(Boolean(statFile.isFile()), true, 'file stat should isFile')
    strictEqual(Boolean(!statFile.isDirectory()), true, 'file stat should !isDirectory')

    const statDirectory = await statAsync(`${__dirname}/..`)
    strictEqual(Boolean(statDirectory), true)
    strictEqual(Boolean(statDirectory.mode), true, 'directory stat should have mode')
    strictEqual(Boolean(!statDirectory.isFile()), true, 'directory stat should !isFile')
    strictEqual(Boolean(statDirectory.isDirectory()), true, 'directory stat should isDirectory')

    await statAsync(`${__dirname}/path-not-exist`).then(
      () => { throw new Error('should throw for path-not-exist') },
      () => 'expected error'
    )
  })

  it('createPathPrefixLock()', () => {
    const checkPath = (getPathFromRoot, rootPath) => {
      const expectedPath = resolve(`${rootPath}/a/b/c`)
      strictEqual(getPathFromRoot('a/b/c'), expectedPath)
      strictEqual(getPathFromRoot('./a/b/c'), expectedPath)
      strictEqual(getPathFromRoot('a/d/../b/c'), expectedPath)
      doThrow(() => getPathFromRoot('..'), `should throw Error for to much '../'`)
      doThrow(() => getPathFromRoot('a/../../b'), `should throw Error for to much '../'`)
    }

    const getPathFromRoot0 = createPathPrefixLock('/root/path/0/')
    const getPathFromRoot1 = createPathPrefixLock('/root/../root/path/./1')
    const getPathFromRoot2 = createPathPrefixLock('/root/path////2')

    checkPath(getPathFromRoot0, '/root/path/0')
    checkPath(getPathFromRoot1, '/root/path/1')
    checkPath(getPathFromRoot2, '/root/path/2')
  })
})
