import { resolve } from 'path'
import { modifyDelete } from 'source/node/file/Modify.js'
import { resetDirectory } from '@dr-js/dev/module/node/file.js'
import { dumpAsync } from './RuntimeDump.js'

const TEST_ROOT = resolve(__dirname, 'runtime-dump-gitignore/')

const { describe, it, before, after } = global

before(() => resetDirectory(TEST_ROOT))
after(() => modifyDelete(TEST_ROOT))

describe('Node.Module.RuntimeDump', () => {
  it('dumpAsync()', async () => {
    await dumpAsync(TEST_ROOT)
  })
})
