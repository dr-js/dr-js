import { strictEqual, stringifyEqual } from 'source/common/verify'
import {
  // indentLine,
  // indentList,
  // autoEllipsis,

  splitCamelCase, joinCamelCase
  // splitSnakeCase, joinSnakeCase,
  // splitKebabCase, joinKebabCase,

  // escapeHTML, unescapeHTML,
  // removeInvalidCharXML
} from './string'

const { describe, it } = global

describe('Common.String', () => {
  it('splitCamelCase()', () => {
    stringifyEqual(splitCamelCase(''), [ '' ])
    stringifyEqual(splitCamelCase('aaaa'), [ 'aaaa' ])
    stringifyEqual(splitCamelCase('Aaaa'), [ 'Aaaa' ])
    stringifyEqual(splitCamelCase('AAAA'), [ 'AAAA' ])
    stringifyEqual(splitCamelCase('111'), [ '111' ])
    stringifyEqual(splitCamelCase('aaa1'), [ 'aaa1' ])
    stringifyEqual(splitCamelCase('Aaaa1'), [ 'Aaaa1' ])
    stringifyEqual(splitCamelCase('A1A2'), [ 'A1', 'A2' ])
    stringifyEqual(splitCamelCase('Test1Test2'), [ 'Test1', 'Test2' ])
    stringifyEqual(splitCamelCase('number1Case2'), [ 'number1', 'Case2' ])
    stringifyEqual(splitCamelCase('MyCamelCaseString'), [ 'My', 'Camel', 'Case', 'String' ])
    stringifyEqual(splitCamelCase('myCamelCaseString'), [ 'my', 'Camel', 'Case', 'String' ])
    stringifyEqual(splitCamelCase('XYZMyCamelCaseP1HTMLStringCSS'), [ 'XYZ', 'My', 'Camel', 'Case', 'P1', 'HTML', 'String', 'CSS' ])
    stringifyEqual(splitCamelCase('aXYZMyCamelCaseP1HTMLStringCSS'), [ 'a', 'XYZ', 'My', 'Camel', 'Case', 'P1', 'HTML', 'String', 'CSS' ])
    stringifyEqual(splitCamelCase('a1XYZMyCamelCaseP1HTMLStringCSS'), [ 'a1', 'XYZ', 'My', 'Camel', 'Case', 'P1', 'HTML', 'String', 'CSS' ])
  })

  it('joinCamelCase()', () => {
    strictEqual(joinCamelCase([ '' ]), '')
    strictEqual(joinCamelCase([ 'aaaa' ]), 'aaaa')
    strictEqual(joinCamelCase([ 'My', 'Camel', 'Case', 'String' ]), 'MyCamelCaseString')
    strictEqual(joinCamelCase([ 'my', 'Camel', 'Case', 'String' ]), 'myCamelCaseString')
    strictEqual(joinCamelCase([ 'my', 'Camel', 'Case', 'String' ], 0), 'MyCamelCaseString')
    strictEqual(joinCamelCase([ 'a1', 'XYZ', 'My', 'Camel', 'Case', 'P1', 'HTML', 'String', 'CSS' ]), 'a1XYZMyCamelCaseP1HTMLStringCSS')
  })
})
