import { resolve } from 'path'
import { modifyDelete } from 'source/node/fs/Modify.js'
import { resetDirectory } from '@dr-js/dev/module/node/file.js'
import { dumpAsync } from './RuntimeDump.js'

const TEST_ROOT = resolve(__dirname, 'runtime-dump-gitignore/')

const { describe, it, before, after } = globalThis

before(() => resetDirectory(TEST_ROOT))
after(() => modifyDelete(TEST_ROOT))

describe('Node.Module.RuntimeDump', () => {
  it('dumpAsync()', async () => {
    await dumpAsync(TEST_ROOT)
  })
})
