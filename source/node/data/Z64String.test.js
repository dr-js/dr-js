import { deflateRawSync, inflateRawSync } from 'node:zlib'
import { stringifyEqual } from 'source/common/verify.js'
import { percent } from 'source/common/format.js'

import {
  packB64, unpackB64,
  packGz64, unpackGz64,
  packBr64, unpackBr64
} from './Z64String.js'

const { describe, it, info = console.log } = globalThis

const TEST_STRING = JSON.stringify(require('../../../package.json'))

describe('Node.Data.Z64String', () => {
  it('packB64/unpackB64()', () => {
    const result = packB64(TEST_STRING)
    info('B64', result.length, percent(result.length / TEST_STRING.length), result)
    stringifyEqual(unpackB64(result), TEST_STRING)
  })

  it('packGz64/unpackGz64()', () => {
    const result = packGz64(TEST_STRING)
    info('Gz64', result.length, percent(result.length / TEST_STRING.length), result)
    stringifyEqual(unpackGz64(result), TEST_STRING)
  })

  __DEV__ && it('packDef64/unpackInf64()', () => { // ratio between gz & br
    const packDef64 = (jsonString) => deflateRawSync(Buffer.from(jsonString), { level: 9 }).toString('base64')
    const unpackInf64 = (jz64String) => String(inflateRawSync(Buffer.from(jz64String, 'base64')))
    const result = packDef64(TEST_STRING)
    info('Def64', result.length, percent(result.length / TEST_STRING.length), result)
    stringifyEqual(unpackInf64(result), TEST_STRING)
  })

  it('packBr64/unpackBr64()', () => {
    const result = packBr64(TEST_STRING)
    info('Br64', result.length, percent(result.length / TEST_STRING.length), result)
    stringifyEqual(unpackBr64(result), TEST_STRING)
  })
})
