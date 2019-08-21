import { strictEqual } from 'source/common/verify'
import { // TODO: add more test
  statAsync
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
})
