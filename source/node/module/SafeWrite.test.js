import nodeModuleAssert from 'assert'
import nodeModuleFs from 'fs'
import nodeModulePath from 'path'
import { createSafeWriteStream } from './SafeWrite'
import { createDirectory, modify } from '../file'
import { setTimeoutAsync } from 'source/common/time'

const { describe, it, before, after } = global
global.__DEV__ = false

const TEST_ROOT = nodeModulePath.join(__dirname, '../../../test-write/')

before('prepare', () => createDirectory(TEST_ROOT))
after('clear', () => modify.delete(TEST_ROOT))

describe('Node.Module.SafeWrite', () => {
  it('createSafeWriteStream() sync write', () => {
    const pathOutputFile = nodeModulePath.join(TEST_ROOT, 'log0')
    const { write, end } = createSafeWriteStream({ pathOutputFile })
    write('1')
    write('2')
    write('3')
    write('4')
    write('5')
    end()
    nodeModuleAssert.equal(nodeModuleFs.readFileSync(pathOutputFile, 'utf8'), `12345`)
  })

  it('createSafeWriteStream() async write 1', async () => {
    const pathOutputFile = nodeModulePath.join(TEST_ROOT, 'log1')
    const { write, end } = createSafeWriteStream({ pathOutputFile })
    write('1')
    await setTimeoutAsync(50)
    write('2')
    await setTimeoutAsync(50)
    write('3')
    await setTimeoutAsync(50)
    write('4')
    await setTimeoutAsync(50)
    write('5')
    end()
    await setTimeoutAsync(50)
    nodeModuleAssert.equal(nodeModuleFs.readFileSync(pathOutputFile, 'utf8'), `12345`)
  })

  it('createSafeWriteStream() async write 2', async () => {
    const pathOutputFile = nodeModulePath.join(TEST_ROOT, 'log2')
    const { write, end } = createSafeWriteStream({ pathOutputFile })
    write('1')
    await setTimeoutAsync(50)
    write('2')
    await setTimeoutAsync(50)
    write('3')
    await setTimeoutAsync(50)
    write('4')
    await setTimeoutAsync(50)
    write('5')
    end()
    nodeModuleAssert.equal(nodeModuleFs.readFileSync(pathOutputFile, 'utf8'), `12345`)
  })

  it('createSafeWriteStream() async write 3', async () => {
    const pathOutputFile = nodeModulePath.join(TEST_ROOT, 'log3')
    const { write, end } = createSafeWriteStream({ pathOutputFile })
    write('1')
    write('2')
    await setTimeoutAsync(50)
    write('3')
    write('4')
    write('5')
    await setTimeoutAsync(50)
    end()
    nodeModuleAssert.equal(nodeModuleFs.readFileSync(pathOutputFile, 'utf8'), `12345`)
  })

  it('createSafeWriteStream() async write 4', async () => {
    const pathOutputFile = nodeModulePath.join(TEST_ROOT, 'log4')
    const { write, end } = createSafeWriteStream({ pathOutputFile })
    await setTimeoutAsync(50)
    write('1')
    write('2')
    write('3')
    write('4')
    write('5')
    end()
    nodeModuleAssert.equal(nodeModuleFs.readFileSync(pathOutputFile, 'utf8'), `12345`)
  })
})
