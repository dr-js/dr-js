import { resolve } from 'path'
import { ok, strictEqual, throws } from 'assert'
import { // TODO: add more test
  statAsync,
  createPathPrefixLock
} from './function'

const { describe, it } = global

describe('Node.File.function', () => {
  it('statAsync()', async () => {
    const statFile = await statAsync(`${__dirname}/function.js`)
    ok(statFile)
    ok(statFile.mode, 'file stat should have mode')
    ok(statFile.size, 'file stat should have size')
    ok(statFile.isFile(), 'file stat should isFile')
    ok(!statFile.isDirectory(), 'file stat should !isDirectory')

    const statDirectory = await statAsync(`${__dirname}/..`)
    ok(statDirectory)
    ok(statDirectory.mode, 'directory stat should have mode')
    ok(!statDirectory.isFile(), 'directory stat should !isFile')
    ok(statDirectory.isDirectory(), 'directory stat should isDirectory')

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
      throws(() => getPathFromRoot('..'), `should throw Error for to much '../'`)
      throws(() => getPathFromRoot('a/../../b'), `should throw Error for to much '../'`)
    }

    const getPathFromRoot0 = createPathPrefixLock('/root/path/0/')
    const getPathFromRoot1 = createPathPrefixLock('/root/../root/path/./1')
    const getPathFromRoot2 = createPathPrefixLock('/root/path////2')

    checkPath(getPathFromRoot0, '/root/path/0')
    checkPath(getPathFromRoot1, '/root/path/1')
    checkPath(getPathFromRoot2, '/root/path/2')
  })
})
