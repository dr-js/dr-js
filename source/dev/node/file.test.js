import { resolve } from 'node:path'
import { stringifyEqual, doThrowAsync } from 'source/common/verify.js'

import {
  findPathFragList,
  filterPrecompressFileList
} from './file'

const { describe, it } = globalThis

const PATH_ROOT = resolve(__dirname, __dirname.includes('output-gitignore') ? '../../../' : '../../')

__DEV__ && console.log({ PATH_ROOT })

describe('File', () => {
  it('findPathFragList()', async () => {
    await doThrowAsync(async () => findPathFragList(PATH_ROOT, [ {} ]))
    await doThrowAsync(async () => findPathFragList(PATH_ROOT, [ 1 ]))
    stringifyEqual(
      await findPathFragList(PATH_ROOT, [ 'non-exist-file' ]),
      undefined
    )
    stringifyEqual(
      await findPathFragList(PATH_ROOT, [ 'package.json' ]),
      resolve(PATH_ROOT, 'package.json')
    )
    stringifyEqual(
      await findPathFragList(PATH_ROOT, [ /pa\w+\.json$/ ]),
      resolve(PATH_ROOT, 'package.json')
    )
    stringifyEqual(
      await findPathFragList(PATH_ROOT, [ 'source/dev/node/file.js' ]),
      resolve(PATH_ROOT, 'source/dev/node/file.js')
    )
    stringifyEqual(
      await findPathFragList(PATH_ROOT, [ 'source/dev', 'node/file.js' ]),
      resolve(PATH_ROOT, 'source/dev/node/file.js')
    )
    stringifyEqual(
      await findPathFragList(PATH_ROOT, [ 'source/dev', /node?/, 'file.js' ]),
      resolve(PATH_ROOT, 'source/dev/node/file.js')
    )
  })

  it('filterPrecompressFileList()', () => {
    const fileList = [
      'a.txt', 'a.txt.br', 'a.txt.gz',
      'b.html',
      'c.tar.gz',
      'd.js', 'd.js.br', 'd.js.gz'
    ]
    const { sourceFileList, sourceCompressList, precompressFileList } = filterPrecompressFileList(fileList)
    stringifyEqual(sourceFileList, [ 'a.txt', 'b.html', 'c.tar.gz', 'd.js' ])
    stringifyEqual(sourceCompressList, [ 'a.txt', 'b.html', 'd.js' ])
    stringifyEqual(precompressFileList, [ 'a.txt.br', 'a.txt.gz', 'd.js.br', 'd.js.gz' ])
  })
})
