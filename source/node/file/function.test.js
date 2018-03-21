import { resolve } from 'path'
import { equal, throws } from 'assert'
import { createPathPrefixLock } from './function'

const { describe, it } = global

describe('Node.File.function', () => {
  it('createPathPrefixLock()', () => {
    const checkPath = (getPathFromRoot, rootPath) => {
      const expectedPath = resolve(`${rootPath}/a/b/c`)
      equal(getPathFromRoot('a/b/c'), expectedPath)
      equal(getPathFromRoot('./a/b/c'), expectedPath)
      equal(getPathFromRoot('a/d/../b/c'), expectedPath)
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
