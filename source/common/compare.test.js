import { strictEqual } from 'source/common/verify'
import {
  compareString,
  compareStringLocale,
  compareStringWithNumber
} from './compare'

const { describe, it } = global

const createTestCompare = (title, compareFunc) => (a, b, result) => strictEqual(
  compareFunc(a, b),
  result,
  `[${title}] compare '${a}' to '${b}'`
)

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
  })
})
