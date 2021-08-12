import { promises as fsAsync } from 'fs'
import { resolve } from 'path'
import { strictEqual, doThrowAsync } from 'source/common/verify.js'
import { getSampleRange } from 'source/common/math/sample.js'
import { createDirectory, resetDirectory } from './Directory.js'
import { modifyDelete } from './Modify.js'

import {
  describeChecksumOfPathList
} from './Checksum.js'

const { describe, it, before, after } = globalThis

const TEST_ROOT = resolve(__dirname, './test-checksum-gitignore/')
const fromRoot = (...args) => resolve(TEST_ROOT, ...args)

before(async () => {
  await resetDirectory(TEST_ROOT)

  await fsAsync.writeFile(fromRoot('sample-cache-file-0'), 'sample-cache-file-0')
  await fsAsync.writeFile(fromRoot('sample-cache-file-1'), 'sample-cache-file-1')

  await createDirectory(fromRoot('sample-cache-dir-0'))
  for (const index of getSampleRange(0, 5)) await fsAsync.writeFile(fromRoot('sample-cache-dir-0', `dir-0-${index}`), `dir-0-${index}`)
  await createDirectory(fromRoot('sample-cache-dir-1'))
  for (const index of getSampleRange(0, 5)) await fsAsync.writeFile(fromRoot('sample-cache-dir-1', `dir-1-${index}`), `dir-1-${index}`)
})
after(async () => {
  await modifyDelete(TEST_ROOT)
})

describe('Node.Fs.Checksum', () => {
  it('getChecksumFileOfPathList', async () => strictEqual(
    await describeChecksumOfPathList({
      pathList: [
        fromRoot('sample-cache-file-0'),
        fromRoot('sample-cache-file-1'),
        fromRoot('sample-cache-dir-0/'),
        fromRoot('sample-cache-dir-1/')
      ]
    }),
    await describeChecksumOfPathList({
      pathList: [
        fromRoot('sample-cache-dir-0/'),
        fromRoot('sample-cache-dir-1/'),
        fromRoot('sample-cache-file-0'),
        fromRoot('sample-cache-file-1')
      ]
    }),
    'path order should not matter'
  ))

  it('getChecksumFileOfPathList path must exist', async () => doThrowAsync(() => describeChecksumOfPathList({
    pathList: [
      fromRoot('sample-cache-file-not-exist')
    ]
  })))
})
