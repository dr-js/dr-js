import { strictEqual } from 'source/common/verify.js'
import {
  typeNameOf,
  describe as describeValue,
  percent,
  mediaTime,
  decimal,
  time,
  binary,
  padTable,
  prettyStringifyJSON, prettyStringifyConfigObject
} from './format.js'

const { describe, it } = globalThis

describe('Common.Format', () => {
  it('typeNameOf()', () => {
    strictEqual(typeNameOf(), 'Undefined')
    strictEqual(typeNameOf(undefined), 'Undefined')

    strictEqual(typeNameOf(null), 'Null')

    strictEqual(typeNameOf(false), 'Boolean')

    strictEqual(typeNameOf(/^[\n]\w$/), 'RegExp')

    strictEqual(typeNameOf(Symbol('123\n')), 'Symbol')

    strictEqual(typeNameOf(new Set([ 1, 2 ])), 'Set')

    strictEqual(typeNameOf(' '), 'String')
    strictEqual(typeNameOf('\n'), 'String')
    strictEqual(typeNameOf('!@#$ "abc" QWE'), 'String')

    strictEqual(typeNameOf(0), 'Number')
    strictEqual(typeNameOf(1e9), 'Number')
    strictEqual(typeNameOf(NaN), 'Number')
    strictEqual(typeNameOf(Infinity), 'Number')

    strictEqual(typeNameOf(() => {}), 'Function')
    strictEqual(typeNameOf(function () {}), 'Function')
    strictEqual(typeNameOf(async () => {}), 'AsyncFunction')
    strictEqual(typeNameOf(async function () {}), 'AsyncFunction')
    strictEqual(typeNameOf(function * () {}), 'GeneratorFunction')
    strictEqual(typeNameOf(async function * () {}), 'AsyncGeneratorFunction') // since nodejs@10

    strictEqual(typeNameOf([]), 'Array')
    strictEqual(typeNameOf([ {} ]), 'Array')
    strictEqual(typeNameOf([ 0, 1, 2, 3, 4, 5 ]), 'Array')

    strictEqual(typeNameOf({}), 'Object')
    strictEqual(typeNameOf({ '': [], 1: 1, a: 'a', ' a a ': '' }), 'Object')
  })

  it('describe()', () => {
    strictEqual(describeValue(), '<Undefined> undefined')
    strictEqual(describeValue(undefined), '<Undefined> undefined')

    strictEqual(describeValue(null), '<Null> null')

    strictEqual(describeValue(false), '<Boolean> false')

    strictEqual(describeValue(/^[\n]\w$/), '<RegExp> /^[\\n]\\w$/')

    strictEqual(describeValue(Symbol('123\n')), '<Symbol> Symbol(123\\n)')

    strictEqual(describeValue(new Set([ 1, 2 ])), '<Set> [object Set]')

    strictEqual(describeValue(' '), '<String> " "')
    strictEqual(describeValue('\n'), '<String> "\\n"')
    strictEqual(describeValue('!@#$ "abc" QWE'), '<String> "!@#$ \\"abc\\" QWE"')

    strictEqual(describeValue(0), '<Number> 0')
    strictEqual(describeValue(1e9), '<Number> 1000000000')
    strictEqual(describeValue(NaN), '<Number> NaN')
    strictEqual(describeValue(Infinity), '<Number> Infinity')

    strictEqual(describeValue(() => {}), '<Function> anonymous')
    strictEqual(describeValue(function () {}), '<Function> anonymous')
    strictEqual(describeValue(async () => {}), '<AsyncFunction> anonymous')
    strictEqual(describeValue(async function () {}), '<AsyncFunction> anonymous')
    strictEqual(describeValue(function * () {}), '<GeneratorFunction> anonymous')
    strictEqual(describeValue(async function * () {}), '<AsyncGeneratorFunction> anonymous') // since nodejs@10

    strictEqual(describeValue([]), '<Array> []')
    strictEqual(describeValue([ {} ]), '<Array> [<Object> {}]')
    strictEqual(describeValue([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]), '<Array> [#10]')

    strictEqual(describeValue({}), '<Object> {}')
    strictEqual(describeValue({ '': [], 1: 1, a: 'a', ' a a ': '' }), '<Object> {"1","","a"," a a "}')

    strictEqual(describeValue(new Error('some message')), '<Error> Error: some message')
  })

  it('percent()', () => {
    strictEqual(percent(), 'NaN%')
    strictEqual(percent(0), '0.00%')
    strictEqual(percent(1), '100.00%')
    strictEqual(percent(0.5), '50.00%')
    strictEqual(percent(-1), '-100.00%')
    strictEqual(percent(-0.001), '-0.10%')
    strictEqual(percent(2), '200.00%')
    strictEqual(percent(10000), '1000000.00%')
  })

  it('mediaTime()', () => {
    strictEqual(mediaTime(), 'NaN:NaN')
    strictEqual(mediaTime(0), '00:00')
    strictEqual(mediaTime(0.1), '00:00')
    strictEqual(mediaTime(0.9), '00:00')
    strictEqual(mediaTime(1), '00:01')
    strictEqual(mediaTime(60), '01:00')
    strictEqual(mediaTime(60 * 60), '60:00')
    strictEqual(mediaTime(-1), '-00:01')
    strictEqual(mediaTime(-60), '-01:00')
    strictEqual(mediaTime(-60 * 60), '-60:00')
  })

  it('decimal()', () => {
    strictEqual(decimal(), 'NaNexa')
    strictEqual(decimal(0), '0')
    strictEqual(decimal(0.1), '100.00milli')
    strictEqual(decimal(0.00001), '10.00micro')
    strictEqual(decimal(100), '100.00')
    strictEqual(decimal(100000), '100.00kilo')
    strictEqual(decimal(100000000), '100.00mega')
    strictEqual(decimal(Number.MAX_VALUE), '1.7976931348623157e+290exa')
    strictEqual(decimal(Number.MAX_SAFE_INTEGER), '9.01peta')
    strictEqual(decimal(Number.MIN_VALUE), '0.00pico')
    strictEqual(decimal(Number.MIN_SAFE_INTEGER), '-9.01peta')
    strictEqual(decimal(Number.EPSILON), '0.00pico')
    strictEqual(decimal(-0.1), '-100.00milli')
    strictEqual(decimal(-0.00001), '-10.00micro')
    strictEqual(decimal(-100), '-100.00')
    strictEqual(decimal(-100000), '-100.00kilo')
    strictEqual(decimal(-100000000), '-100.00mega')
    strictEqual(decimal(-Number.MAX_VALUE), '-1.7976931348623157e+290exa')
    strictEqual(decimal(-Number.MAX_SAFE_INTEGER), '-9.01peta')
    strictEqual(decimal(-Number.MIN_VALUE), '-0.00pico')
    strictEqual(decimal(-Number.MIN_SAFE_INTEGER), '9.01peta')
    strictEqual(decimal(-Number.EPSILON), '-0.00pico')
  })

  it('time()', () => {
    strictEqual(time(), 'NaNd')
    strictEqual(time(0), '0ms')
    strictEqual(time(0.1), '0ms')
    strictEqual(time(0.00001), '0ms')
    strictEqual(time(100), '100ms')
    strictEqual(time(100000), '1.67m')
    strictEqual(time(100000000), '27.78h')
    strictEqual(time(Number.MAX_SAFE_INTEGER), '104249991.37d')
    strictEqual(time(-0.1), '-1ms')
    strictEqual(time(-0.00001), '-1ms')
    strictEqual(time(-100), '-100ms')
    strictEqual(time(-100000), '-1.67m')
    strictEqual(time(-100000000), '-27.78h')
    strictEqual(time(-Number.MAX_SAFE_INTEGER), '-104249991.37d')
  })

  it('binary()', () => {
    strictEqual(binary(), 'NaNTi')
    strictEqual(binary(0), '0')
    strictEqual(binary(0.1), '0')
    strictEqual(binary(0.00001), '0')
    strictEqual(binary(100), '100')
    strictEqual(binary(100000), '97.66Ki')
    strictEqual(binary(100000000), '95.37Mi')
    strictEqual(binary(100000000000), '93.13Gi')
    strictEqual(binary(Number.MAX_SAFE_INTEGER), '8192.00Ti')
    strictEqual(binary(-0.1), '-1')
    strictEqual(binary(-0.00001), '-1')
    strictEqual(binary(-100), '-100')
    strictEqual(binary(-100000), '-97.66Ki')
    strictEqual(binary(-100000000), '-95.37Mi')
    strictEqual(binary(-100000000000), '-93.13Gi')
    strictEqual(binary(-Number.MAX_SAFE_INTEGER), '-8192.00Ti')
  })

  it('padTable()', () => {
    const testPadTable = (table, padFuncList, outputLineList = []) => strictEqual(padTable({ table, padFuncList }), outputLineList.join('\n'))

    testPadTable([], undefined, [])
    testPadTable([ [], [] ], undefined, [ '', '' ])
    testPadTable([
      [ 0, 1, 2, 3 ],
      [ 0, 1 ]
    ], undefined, [
      '0 | 1 | 2 | 3',
      '0 | 1'
    ])
    testPadTable([
      [ 1111, 1111, 1111, 1111 ],
      [ 0, 0, 0, 0 ]
    ], [ 'L', 'R', 'L' ], [
      '1111 | 1111 | 1111 | 1111',
      '0    |    0 | 0    | 0   '
    ])
  })

  it('prettyStringifyJSON()', () => {
    const testPrettyStringifyJSON = (value, { unfoldLevel, pad } = {}, outputLineList = []) => strictEqual(prettyStringifyJSON(value, unfoldLevel, pad), outputLineList.join('\n'))

    testPrettyStringifyJSON(null, undefined, [ 'null' ])
    testPrettyStringifyJSON(NaN, undefined, [ 'null' ])
    testPrettyStringifyJSON(Infinity, undefined, [ 'null' ])

    testPrettyStringifyJSON(undefined, undefined, [ '' ])
    testPrettyStringifyJSON(() => {}, undefined, [ '' ])
    testPrettyStringifyJSON(Object.assign(() => {}, { toJSON: () => 'some-value' }), undefined, [ '"some-value"' ])
    testPrettyStringifyJSON(Symbol(''), undefined, [ '' ])

    testPrettyStringifyJSON({}, undefined, [ '{}' ])
    testPrettyStringifyJSON([], undefined, [ '[]' ])

    testPrettyStringifyJSON({ a: undefined, b: () => {} }, undefined, [ '{}' ])

    testPrettyStringifyJSON(Object.assign([ Object.assign([], { length: 2 }) ], { length: 2 }), undefined, [
      '[',
      '  [',
      '    null,',
      '    null',
      '  ],',
      '  null',
      ']'
    ])
    testPrettyStringifyJSON(Object.assign([ Object.assign([], { length: 2 }) ], { length: 2 }), { unfoldLevel: 1 }, [
      '[',
      '  [null,null],',
      '  null',
      ']'
    ])

    const COMPLEX_OBJECT = {
      a: undefined,
      b: () => {},
      c: Object.assign(() => {}, { toJSON: () => 'some-value' }),
      d: Symbol(''),
      e: {},
      f: [],
      _: {
        _a: undefined,
        _b: () => {},
        _c: Object.assign(() => {}, { toJSON: () => 'some-value' }),
        _d: Symbol(''),
        _e: {},
        _f: []
      }
    }
    testPrettyStringifyJSON(COMPLEX_OBJECT, undefined, [
      '{',
      '  "c": "some-value",',
      '  "e": {},',
      '  "f": [],',
      '  "_": {',
      '    "_c": "some-value",',
      '    "_e": {},',
      '    "_f": []',
      '  }',
      '}'
    ])
    testPrettyStringifyJSON(COMPLEX_OBJECT, { unfoldLevel: 1 }, [
      '{',
      '  "c": "some-value",',
      '  "e": {},',
      '  "f": [],',
      '  "_": {"_c":"some-value","_e":{},"_f":[]}',
      '}'
    ])
    testPrettyStringifyJSON(COMPLEX_OBJECT, { unfoldLevel: 1, pad: '' }, [
      '{',
      '"c": "some-value",',
      '"e": {},',
      '"f": [],',
      '"_": {"_c":"some-value","_e":{},"_f":[]}',
      '}'
    ])

    const COMPLEX_ARRAY = [
      undefined,
      () => {},
      Object.assign(() => {}, { toJSON: () => 'some-value' }),
      Symbol(''),
      [
        undefined,
        () => {},
        Object.assign(() => {}, { toJSON: () => 'some-value' }),
        Symbol('')
      ]
    ]
    testPrettyStringifyJSON(COMPLEX_ARRAY, undefined, [
      '[',
      '  null,',
      '  null,',
      '  "some-value",',
      '  null,',
      '  [',
      '    null,',
      '    null,',
      '    "some-value",',
      '    null',
      '  ]',
      ']'
    ])
    testPrettyStringifyJSON(COMPLEX_ARRAY, { unfoldLevel: 1 }, [
      '[',
      '  null,',
      '  null,',
      '  "some-value",',
      '  null,',
      '  [null,null,"some-value",null]',
      ']'
    ])
    testPrettyStringifyJSON(COMPLEX_ARRAY, { unfoldLevel: 1, pad: '' }, [
      '[',
      'null,',
      'null,',
      '"some-value",',
      'null,',
      '[null,null,"some-value",null]',
      ']'
    ])
  })

  it('prettyStringifyConfigObject()', () => {
    const testPrettyStringifyConfigObject = (value, pad, outputLineList = []) => {
      const PAD_STRING_INITIAL = '=!@#$%='
      const actual = prettyStringifyConfigObject(value, pad, PAD_STRING_INITIAL)
      const expect = `${PAD_STRING_INITIAL}${outputLineList.join(`\n${PAD_STRING_INITIAL}`)}`
      __DEV__ && console.log({ match: actual === expect, actual, expect })
      strictEqual(actual, expect)
    }

    testPrettyStringifyConfigObject(undefined, undefined, [ 'undefined' ])
    testPrettyStringifyConfigObject(null, undefined, [ 'null' ])
    testPrettyStringifyConfigObject(NaN, undefined, [ 'NaN' ])
    testPrettyStringifyConfigObject(Infinity, undefined, [ 'Infinity' ])
    testPrettyStringifyConfigObject(-Infinity, undefined, [ '-Infinity' ])

    testPrettyStringifyConfigObject(() => {}, undefined, [ 'Function' ])
    testPrettyStringifyConfigObject(Object.assign(() => {}, { toJSON: () => 'some-value' }), undefined, [ 'Function' ])
    testPrettyStringifyConfigObject(Symbol(''), undefined, [ 'Symbol()' ])

    testPrettyStringifyConfigObject({}, undefined, [ '{}' ])
    testPrettyStringifyConfigObject([], undefined, [ '[]' ])

    testPrettyStringifyConfigObject({ a: undefined, b: () => {} }, undefined, [
      'a: undefined',
      'b: Function'
    ])

    testPrettyStringifyConfigObject(Object.assign([ Object.assign([], { length: 2 }) ], { length: 2 }), undefined, [
      '- ',
      '  - undefined',
      '  - undefined',
      '- undefined'
    ])

    const COMPLEX_OBJECT = {
      a: undefined,
      b: () => {},
      c: Object.assign(() => {}, { toJSON: () => 'some-value' }),
      d: Symbol(''),
      e: {},
      f: [],
      _: {
        _a: undefined,
        _b: () => {},
        _c: Object.assign(() => {}, { toJSON: () => 'some-value' }),
        _d: Symbol(''),
        _e: {},
        _f: []
      },
      $: [
        undefined,
        () => {},
        Object.assign(() => {}, { toJSON: () => 'some-value' }),
        Symbol(''),
        {},
        []
      ]
    }
    testPrettyStringifyConfigObject(COMPLEX_OBJECT, undefined, [
      'a: undefined',
      'b: Function',
      'c: Function',
      'd: Symbol()',
      'e: {}',
      'f: []',
      '_: ',
      '  _a: undefined',
      '  _b: Function',
      '  _c: Function',
      '  _d: Symbol()',
      '  _e: {}',
      '  _f: []',
      '$: ',
      '  - undefined',
      '  - Function',
      '  - Function',
      '  - Symbol()',
      '  - {}',
      '  - []'
    ])
    testPrettyStringifyConfigObject(COMPLEX_OBJECT, '   ', [
      'a: undefined',
      'b: Function',
      'c: Function',
      'd: Symbol()',
      'e: {}',
      'f: []',
      '_: ',
      '   _a: undefined',
      '   _b: Function',
      '   _c: Function',
      '   _d: Symbol()',
      '   _e: {}',
      '   _f: []',
      '$: ',
      '   - undefined',
      '   - Function',
      '   - Function',
      '   - Symbol()',
      '   - {}',
      '   - []'
    ])

    const COMPLEX_ARRAY = [
      undefined,
      () => {},
      Object.assign(() => {}, { toJSON: () => 'some-value' }),
      Symbol(''),
      [
        undefined,
        () => {},
        Object.assign(() => {}, { toJSON: () => 'some-value' }),
        Symbol('')
      ]
    ]
    testPrettyStringifyConfigObject(COMPLEX_ARRAY, undefined, [
      '- undefined',
      '- Function',
      '- Function',
      '- Symbol()',
      '- ',
      '  - undefined',
      '  - Function',
      '  - Function',
      '  - Symbol()'
    ])
    testPrettyStringifyConfigObject(COMPLEX_ARRAY, '     ', [
      '- undefined',
      '- Function',
      '- Function',
      '- Symbol()',
      '- ',
      '     - undefined',
      '     - Function',
      '     - Function',
      '     - Symbol()'
    ])
  })
})
