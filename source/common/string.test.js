import { strictEqual, stringifyEqual, doThrow } from 'source/common/verify'
import {
  // indentLine,
  // indentList,
  // autoEllipsis,

  splitCamelCase, joinCamelCase,
  // splitSnakeCase, joinSnakeCase,
  // splitKebabCase, joinKebabCase,

  createMarkReplacer,

  escapeHTML, unescapeHTML
  // removeInvalidCharXML
} from './string'

const { describe, it } = global

describe('Common.String', () => {
  it('escapeHTML/unescapeHTML()', () => {
    const testEscapeUnescapeHTML = (source, expectEscaped) => {
      strictEqual(escapeHTML(source), expectEscaped, 'escapeHTML()')
      strictEqual(unescapeHTML(expectEscaped), source, 'unescapeHTML()')
    }

    testEscapeUnescapeHTML('', '')
    testEscapeUnescapeHTML('a', 'a')
    testEscapeUnescapeHTML('&amp;', '&#38;amp;')
    testEscapeUnescapeHTML('&#38;', '&#38;#38;')

    strictEqual(unescapeHTML('54321&amp;12345'), '54321&12345')
    strictEqual(unescapeHTML('54321&#38;12345'), '54321&12345')
  })

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

  it('createMarkReplacer()', () => {
    doThrow(() => createMarkReplacer({ '!': 'invalid-key' }))
    doThrow(() => createMarkReplacer({ 'invalid-value': null }))

    const TEXT_REPLACE_FROM = 'replace: {a-b}, {c-d}'
    const TEXT_REPLACE_TO = 'replace: A-B, C-D'
    const TEXT_NOT_REPLACE = 'not replace: a-b, c-d, {e-f}, {a-}, {-}, {-d}, {a-b-c-d}, {y-z}'
    const markReplacer = createMarkReplacer({
      'a-b': 'A-B',
      'c-d': 'C-D',
      'y-z': undefined // allow undefined to skip replace
    })
    strictEqual(markReplacer(TEXT_REPLACE_FROM), TEXT_REPLACE_TO)
    strictEqual(markReplacer(TEXT_NOT_REPLACE), TEXT_NOT_REPLACE)
    strictEqual(
      markReplacer([ TEXT_REPLACE_FROM, TEXT_NOT_REPLACE, TEXT_REPLACE_FROM, TEXT_NOT_REPLACE ].join(' AND ')),
      [ TEXT_REPLACE_TO, TEXT_NOT_REPLACE, TEXT_REPLACE_TO, TEXT_NOT_REPLACE ].join(' AND ')
    )
  })
})
