import { strictEqual, doThrow, truthy } from 'source/common/verify.js'

import { probeSync, createArgListPack } from './function.js'

const { describe, it } = globalThis

describe('Node.Module.function', () => {
  it('probeSync()', () => {
    truthy(probeSync([ 'node', '--help' ], 'node'))
    truthy(!probeSync([ 'qwertyuiop1234567890', '--version' ], 'qwertyuiop1234567890'))
  })

  it('createArgListPack() exist', () => {
    const args = [ 'node' ]
    const { check, verify } = createArgListPack(
      () => probeSync([ 'node', '--help' ], 'node') ? args : undefined,
      'node should exist'
    )
    truthy(check())
    strictEqual(verify(), args)
  })

  it('createArgListPack() non-exist', () => {
    const { check, verify } = createArgListPack(
      () => probeSync([ 'qwertyuiop1234567890', '--version' ], 'qwertyuiop1234567890') ? [ 'non-exist' ] : undefined,
      'qwertyuiop1234567890 should not exist'
    )
    truthy(!check())
    doThrow(verify)
  })
})
