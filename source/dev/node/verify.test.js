import { doThrow, doThrowAsync, strictEqual } from 'source/common/verify.js'
import { readBuffer, readText } from 'source/node/fs/File.js'
import { getKitLogger } from 'source/node/kit.js'

import {
  verifyString,
  verifyFile,
  verifySemVer,
  verifyCommand,

  verifyFileString,
  verifyCommandSemVer,

  useKitLogger,
  toTask, /* runTaskList, */ verifyTaskList
} from './verify.js'

const { describe, it, before, info = console.log } = global

before(() => {
  useKitLogger(getKitLogger({
    title: 'test-verify',
    isNoEnvKey: true,
    logFunc: info,
    padWidth: 80
  }))
})

describe('Node.Verify', () => {
  it('verifyString', () => {
    verifyString('a b\nc d', 'a b\nc d')
    verifyString('a b\nc d', ' b\nc ')
    verifyString('a b\nc d', /b\s+c/)
    verifyString('a b\nc d', [
      'b\nc', ' b\nc', /b\s+c/
    ])

    doThrow(() => verifyString('a b\nc d', 'oops'))
    doThrow(() => verifyString('a b\nc d', [
      'b\nc', ' b\nc', 'oops', /b\s+c/
    ]))
  })

  it('verifyFile', async () => {
    await verifyFile(__filename, async (buffer) => { strictEqual(Buffer.compare(await readBuffer(__filename), buffer), 0) })

    await doThrowAsync(async () => verifyFile('/file/not/exist/1/2/3/4/5/6', () => {}))
    await doThrowAsync(async () => verifyFile(__filename, () => { throw new Error('verify failed') }))
  })

  it('verifyCommand', () => {
    verifyCommand('node -v')
    verifyCommand([ 'node', '-v' ])

    doThrow(() => verifyCommand([ 'node', '-e', 'process.exitCode = 1' ]))
    doThrow(() => verifyCommand('command-not-exist -v'))
  })

  it('verifySemVer', () => {
    verifySemVer('0.1.0', '0.1.0')
    verifySemVer('0.1.0', '0.1')
    verifySemVer('0.1.0', '^0.1.0')
    verifySemVer('0.1.0', '>=0.1.0')

    verifySemVer('v0.1.0', '0.1.0')
    verifySemVer('0.1.1', '^0.1.0')
    verifySemVer('v0.2.0', '>=0.1.0')

    verifySemVer('19.03.12', '>=19') // Docker version is not SemVer, but close

    doThrow(() => verifySemVer('0.2.0', '0.1.0'))
    doThrow(() => verifySemVer('0.2.0', '^0.1.0'))
    doThrow(() => verifySemVer('0.2.0', '0.1'))
  })

  it('verifyFileString', async () => {
    await verifyFileString(__filename, await readText(__filename))

    await doThrowAsync(() => verifyFileString('/file/not/exist/1/2/3/4/5/6', 'nope'))
    await doThrowAsync(() => verifyCommandSemVer(__filename, 'mismatch content'))
  })

  it('verifyCommandSemVer', async () => {
    await verifyCommandSemVer('node -v', '>=14.15')
    await verifyCommandSemVer('npm -v', '>=6.14')

    await doThrowAsync(() => verifyCommandSemVer('node -v', '8'))
    await doThrowAsync(() => verifyCommandSemVer('npm -v', '5'))
    await doThrowAsync(() => verifyCommandSemVer('command-not-exist -v', '1.0.0'))
  })

  it('verifyTaskList+toTask', async () => {
    await verifyTaskList([
      toTask('title: verifyString', 'should pass', async () => {
        verifyString('a b\nc d', 'a b\nc d')
        verifyString('a b\nc d', ' b\nc ')
      }),
      toTask('title: verifyCommand', 'should pass', async () => {
        verifyCommand('node -v')
        verifyCommand([ 'node', '-v' ])
      }),
      toTask('title: verifySemVer', 'should pass', async () => {
        verifySemVer('0.1.0', '0.1.0')
        verifySemVer('0.1.0', '0.1')
        verifySemVer('0.1.0', '^0.1.0')
        verifySemVer('0.1.0', '>=0.1.0')
      }),
      toTask('title: verifyCommandSemVer', 'should pass', async () => {
        await verifyCommandSemVer('node -v', '>=14.15')
        await verifyCommandSemVer('npm -v', '>=6.14')
      })
    ])
  })
})
