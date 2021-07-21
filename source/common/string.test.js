import { strictEqual, stringifyEqual, doThrow } from 'source/common/verify.js'
import { time, binary } from 'source/common/format.js'
import { createStepper } from 'source/common/time.js'
import { withRepeat } from 'source/common/function.js'
import {
  // indentLine,
  // indentList,
  // autoEllipsis,

  splitCamelCase, joinCamelCase,
  // splitSnakeCase, joinSnakeCase,
  // splitKebabCase, joinKebabCase,

  createMarkReplacer,

  // escapeRegExp,
  replaceAll,

  escapeHTML, unescapeHTML,
  // removeInvalidCharXML,

  // lazyEncodeURI,

  forEachRegExpExec,
  forEachLine
} from './string.js'

const { describe, it, info = console.log } = globalThis

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

  it('replaceAll()', () => {
    strictEqual(
      replaceAll('aaa[!@#$%^&*(){}-=_+]bbb[!@#$%^&*(){}-=_+]ccc[!@#$%^&*(){}-=_+]ddd', '[!@#$%^&*(){}-=_+]', '-'),
      'aaa-bbb-ccc-ddd'
    )
    strictEqual(
      replaceAll('aaaaaaaaaaaa', 'aaa', '-'),
      '----'
    )
  })

  // forEachLine
  it('forEachRegExpExec()', () => {
    const resultList = []
    forEachRegExpExec(/\w(\d+)/g, 'A0 B1 C2 a000 b111 c222', (result) => { resultList.push([ result[ 0 ], result[ 1 ] ]) })
    stringifyEqual(resultList, [
      [ 'A0', '0' ],
      [ 'B1', '1' ],
      [ 'C2', '2' ],
      [ 'a000', '000' ],
      [ 'b111', '111' ],
      [ 'c222', '222' ]
    ])
  })
  it('forEachRegExpExec() break loop', () => {
    const resultList = []
    forEachRegExpExec(/\w(\d+)/g, 'A0 B1 C2 a000 b111 c222', (result) => resultList.push([ result[ 0 ], result[ 1 ] ]) || 'break-loop')
    stringifyEqual(resultList, [
      [ 'A0', '0' ]
    ], 'should stop loop when truthy value is returned')
  })
  it('forEachRegExpExec() empty string', () => {
    const resultList = []
    forEachRegExpExec(/\w(\d+)/g, '', (result) => { resultList.push([ result[ 0 ], result[ 1 ] ]) })
    stringifyEqual(resultList, [])
  })

  it('forEachLine()', () => {
    const string = '\n\nA0 B1 C2\na000 b111 c222\n\n'
    const resultList = []
    forEachLine(string, (line) => { resultList.push(line) })
    stringifyEqual(resultList, string.split('\n'))
  })
  it('forEachLine() break loop', () => {
    const string = '\n\nA0 B1 C2\na000 b111 c222\n\n'
    const resultList = []
    forEachLine(string, (line) => resultList.push(line) || 'break-loop')
    stringifyEqual(resultList, [ '' ], 'should stop loop when truthy value is returned')
  })
  it('forEachLine() single line', () => {
    const string = 'A0 B1 C2 a000 b111 c222'
    const resultList = []
    forEachLine(string, (line) => { resultList.push(line) })
    stringifyEqual(resultList, string.split('\n'))
  })
  it('forEachLine() empty string', () => {
    const string = ''
    const resultList = []
    forEachLine(string, (line) => { resultList.push(line) })
    stringifyEqual(resultList, string.split('\n'))
  })
  __DEV__ && it('forEachLine() benchmark', () => { // NOTE: for now it seems avoid array push will increase performance
    const stepper = createStepper()
    const string = '\n\nA0 B1 C2\na000 b111 c222\n\n'.repeat(1024).repeat(1024)
    info(time(stepper()), 'done prepare', binary(string.length))

    withRepeat((looped) => {
      const resultList = []
      forEachLine(string, (line) => { resultList.push(line) })
      info(looped, time(stepper()), 'done forEachLine')

      let resultCount = 0
      forEachLine(string, (line) => { resultCount++ })
      info(looped, time(stepper()), 'done forEachLine count')

      const expectList = string.split('\n')
      info(looped, time(stepper()), 'done split')

      stringifyEqual(resultList, expectList)
      strictEqual(resultCount, expectList.length)
    }, 4)
  })
})
