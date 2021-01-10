import { resolve } from 'path'
import { strictEqual } from 'source/common/verify'
import { existPath } from 'source/node/file/Path'
import { run } from 'source/node/run'

const { describe, it } = global

describe('Node.System.ExitListener', () => {
  it('guardPromiseEarlyExit', async () => {
    const PATH_ROOT = (await existPath(resolve(__dirname, '../../../../babel.config.js'))) // test where `babel.config.js` is
      ? resolve(__dirname, '../../../../')
      : resolve(__dirname, '../../../../../')

    await run([
      process.execPath, '-r', '@babel/register', resolve(__dirname, 'guardPromiseEarlyExit.pass.js')
    ], { cwd: PATH_ROOT }).promise

    await run([
      process.execPath, '-r', '@babel/register', resolve(__dirname, 'guardPromiseEarlyExit.exit-42.js')
    ], { cwd: PATH_ROOT }).promise.then(
      () => { throw new Error('should not pass') },
      (error) => strictEqual(error.code, 42)
    )
  })
})
