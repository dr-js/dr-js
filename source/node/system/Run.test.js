import { runQuiet } from './Run'

const { describe, it } = global

describe('Node.System.Run', () => {
  it('runQuiet()', async () => {
    const { stdoutBufferPromise } = await runQuiet({ command: process.platform === 'win32' ? 'dir' : 'ls -l' })
    console.warn((await stdoutBufferPromise).toString())
  })
})
