import { strictEqual } from 'source/common/verify.js'
import {
  compareString,
  compareStringLocale,
  compareStringWithNumber
} from './compare.js'

const { describe, it } = globalThis

const createTestCompare = (title, compareFunc) => (a, b, result) => strictEqual(
  compareFunc(a, b),
  result,
  `[${title}] compare '${a}' to '${b}'`
)

const TEST_LIST = [
  ' ', '+', '?', '[', '{',
  '0', '01', '1', '2', '10', '010', '19', '20',
  'a', 'A', 'b', 'B',
  'a0', 'a2', 'a10', 'a010',
  'A0', 'A2', 'A10', 'A010',
  'aB', 'ab', 'Ab', 'AB',
  'aa', 'bb', 'AA', 'BB',
  'c'
]

describe('Common.Compare', () => {
  it('compareString()', () => {
    const test = createTestCompare('compareString', compareString)

    test('a', 'a', 0)
    test('ab', 'a', 1)
    test('ab', 'abc', -1)

    test('2', '1', 1)
    test('2', '10', 1) // not aware of number

    test('a-2', 'a-1', 1)
    test('a-2', 'a-10', 1) // not aware of number

    test('2-a', '1-a', 1)
    test('2-a', '10-a', 1) // not aware of number

    test('a', 'A', 1) // ASCII order
    test('a', 'B', 1) // ASCII order

    strictEqual(TEST_LIST.sort(compareString).join(','), ' ,+,0,01,010,1,10,19,2,20,?,A,A0,A010,A10,A2,AA,AB,Ab,B,BB,[,a,a0,a010,a10,a2,aB,aa,ab,b,bb,c,{')
  })

  it('compareStringLocale()', () => {
    const test = createTestCompare('compareStringLocale', compareStringLocale)

    test('a', 'a', 0)
    test('ab', 'a', 1)
    test('ab', 'abc', -1)

    test('2', '1', 1)
    test('2', '10', 1) // not aware of number

    test('a-2', 'a-1', 1)
    test('a-2', 'a-10', 1) // not aware of number

    test('2-a', '1-a', 1)
    test('2-a', '10-a', 1) // not aware of number

    test('a', 'A', -1) // dir listing order
    test('a', 'B', -1) // dir listing order

    strictEqual(TEST_LIST.sort(compareStringLocale).join(','), ' ,?,[,{,+,0,01,010,1,10,19,2,20,a,A,a0,A0,a010,A010,a10,A10,a2,A2,aa,AA,ab,aB,Ab,AB,b,B,bb,BB,c')
  })

  it('compareStringWithNumber()', () => {
    const test = createTestCompare('compareStringWithNumber', compareStringWithNumber)

    test('a', 'a', 0)
    test('ab', 'a', 98)
    test('ab', 'abc', -99)

    test('2', '1', 1)
    test('2', '10', -8) // aware of number

    test('a-2', 'a-1', 1)
    test('a-2', 'a-10', -8) // aware of number

    test('2-a', '1-a', 1)
    test('2-a', '10-a', -8) // aware of number

    strictEqual(TEST_LIST.sort(compareStringWithNumber).join(','), ' ,+,0,01,1,2,010,10,19,20,?,A,A0,A2,A010,A10,AA,AB,Ab,B,BB,[,a,a0,a2,a010,a10,aB,aa,ab,b,bb,c,{')
  })
})
