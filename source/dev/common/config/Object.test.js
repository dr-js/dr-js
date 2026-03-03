import { stringifyEqual, doThrow } from 'source/common/verify.js'

import {
  useFlavor,
  useSecret
} from './Object.js'

const { describe, it, info = console.log } = global

describe('Node.Config.Object', () => {
  it('useFlavor', () => {
    stringifyEqual(
      useFlavor(
        { a: 1 },
        { 'F0': { a: 2 } },
        'F0'
      ),
      { a: 2 },
      'basic merge'
    )

    stringifyEqual(
      useFlavor(
        { a: { b: 1 } },
        { 'F0': { a: { c: 1 } } },
        'F0'
      ),
      { a: { b: 1, c: 1 } },
      'basic deep merge'
    )

    stringifyEqual(
      useFlavor(
        { a: 1 },
        { 'F0': { a: undefined } },
        'F0'
      ),
      { a: undefined },
      'basic mute value'
    )

    stringifyEqual(
      useFlavor(
        { a: 1, b: 1 },
        { 'F0|F1': { a: 2 }, 'F0': { b: 2 } },
        'F0'
      ),
      { a: 2, b: 2 },
      'both combo and key'
    )

    stringifyEqual(
      Object.keys(useFlavor(
        { a: 1, b: 1, c: 1 },
        { 'F0': { A: 2, b: 2 } },
        'F0'
      )),
      [ 'a', 'b', 'c', 'A' ],
      'keep existing key order and append new keys'
    )

    doThrow(() => useFlavor(
      { a: 1 },
      { 'F0|F1': 'invalid', 'F0': { b: 2 } },
      'F0'
    ), 'should check invalid flavor config type like String')
  })

  it('useSecret', () => {
    const onSecret = (secretPath, valueType) => info(`  - onSecret: ${secretPath} <${valueType}>`)

    stringifyEqual(
      useSecret(
        {
          a: '@@.A.B.C.S1',
          b: '@@.A.B.C.S2',
          c: '@@.A.B.C.S3'
        },
        { A: { B: { C: { S1: 42, S2: '42', S3: { 42: [] } } } } },
        onSecret
      ),
      {
        a: 42,
        b: '42',
        c: { 42: [] }
      },
      'basic value'
    )

    stringifyEqual(
      useSecret(
        {
          a: { b: { c: { d: '@@.SECRET' } } },
          A: { B: { C: { D: '@@.SECRET' } } }
        },
        { SECRET: [ 42 ] },
        onSecret
      ),
      {
        a: { b: { c: { d: [ 42 ] } } },
        A: { B: { C: { D: [ 42 ] } } }
      },
      'deeper value'
    )

    doThrow(() => useSecret(
      { a: { b: { c: { d: '@@.SECRET' } } } },
      { nope: 0 },
      onSecret
    ), 'should error on secret missing')
  })
})
