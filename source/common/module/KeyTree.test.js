import { strictEqual, stringifyEqual } from 'source/common/verify'
import { getRandomId } from 'source/common/math/random'
import { createKeyTreeEnhanced } from './KeyTree'

const { describe, it } = global

describe('source/common/module/KeyTree', () => {
  const NAME_KEY = getRandomId('key').replace(/\W/g, '')
  const NAME_SUB_LIST = getRandomId('subList').replace(/\W/g, '')

  const {
    stringify,
    parse,
    createBuilder,
    walkKeyTreeJSON
  } = createKeyTreeEnhanced({ NAME_KEY, NAME_SUB_LIST })

  const TEST_JSON_0 = [ { [ NAME_KEY ]: 'key-0-0-0' } ]
  const TEST_STRING_0 = '[key-0-0-0]'

  const TEST_JSON_1 = [ { [ NAME_KEY ]: 'key-0-0-0' }, { [ NAME_KEY ]: 'key-1-0-1' } ]
  const TEST_STRING_1 = '[key-0-0-0,key-1-0-1]'

  const TEST_JSON_2 = [
    {
      [ NAME_KEY ]: 'key-0-0-0',
      [ NAME_SUB_LIST ]: [
        {
          [ NAME_KEY ]: 'key-1-0-1',
          [ NAME_SUB_LIST ]: [
            { [ NAME_KEY ]: 'key-2-0-2' },
            { [ NAME_KEY ]: 'key-2-1-3' }
          ]
        },
        { [ NAME_KEY ]: 'key-1-1-4' }
      ]
    },
    { [ NAME_KEY ]: 'key-0-1-5' },
    {
      [ NAME_KEY ]: 'key-0-2-6',
      [ NAME_SUB_LIST ]: [
        { [ NAME_KEY ]: 'key-1-0-7' },
        { [ NAME_KEY ]: 'key-1-1-8' }
      ]
    },
    { [ NAME_KEY ]: 'key-0-3-9' }
  ]
  const TEST_STRING_2 = '[key-0-0-0[key-1-0-1[key-2-0-2,key-2-1-3]key-1-1-4]key-0-1-5,key-0-2-6[key-1-0-7,key-1-1-8]key-0-3-9]'

  const TEST_JSON_3 = [
    {
      [ NAME_KEY ]: 'key-0-0-0',
      [ NAME_SUB_LIST ]: [
        {
          [ NAME_KEY ]: 'key-1-0-1',
          [ NAME_SUB_LIST ]: [
            { [ NAME_KEY ]: 'key-2-0-2' },
            { [ NAME_KEY ]: 'key-2-1-3' }
          ]
        }
      ]
    }
  ]
  const TEST_STRING_3 = '[key-0-0-0[key-1-0-1[key-2-0-2,key-2-1-3]]]'

  it('stringify/parse', () => {
    strictEqual(stringify(TEST_JSON_0), TEST_STRING_0)
    stringifyEqual(parse(TEST_STRING_0), TEST_JSON_0)
    strictEqual(stringify(parse(TEST_STRING_0)), TEST_STRING_0)
    stringifyEqual(parse(stringify(TEST_JSON_0)), TEST_JSON_0)

    strictEqual(stringify(TEST_JSON_1), TEST_STRING_1)
    stringifyEqual(parse(TEST_STRING_1), TEST_JSON_1)
    strictEqual(stringify(parse(TEST_STRING_1)), TEST_STRING_1)
    stringifyEqual(parse(stringify(TEST_JSON_1)), TEST_JSON_1)

    strictEqual(stringify(TEST_JSON_2), TEST_STRING_2)
    stringifyEqual(parse(TEST_STRING_2), TEST_JSON_2)
    strictEqual(stringify(parse(TEST_STRING_2)), TEST_STRING_2)
    stringifyEqual(parse(stringify(TEST_JSON_2)), TEST_JSON_2)

    strictEqual(stringify(TEST_JSON_3), TEST_STRING_3)
    stringifyEqual(parse(TEST_STRING_3), TEST_JSON_3)
    strictEqual(stringify(parse(TEST_STRING_3)), TEST_STRING_3)
    stringifyEqual(parse(stringify(TEST_JSON_3)), TEST_JSON_3)
  })

  it('createBuilder', () => {
    const EXPECTED_ROOT_OBJECT = {
      [ NAME_KEY ]: 'root',
      [ NAME_SUB_LIST ]: [
        { [ NAME_KEY ]: '0', [ NAME_SUB_LIST ]: [ { [ NAME_KEY ]: '0-0' } ] },
        { [ NAME_KEY ]: '9', [ NAME_SUB_LIST ]: [ { [ NAME_KEY ]: '9-9' } ] }
      ]
    }

    const builder = createBuilder('root')
    builder.add('0', 0, 'root')
    builder.add('0-0', 0, '0')
    builder.add('9-9', 9, '9')
    builder.add('9', 9, 'root')
    const rootObject = builder.build()
    stringifyEqual(rootObject, EXPECTED_ROOT_OBJECT)
    stringifyEqual(parse(stringify(rootObject[ NAME_SUB_LIST ])), EXPECTED_ROOT_OBJECT[ NAME_SUB_LIST ])

    stringifyEqual(builder.build(), { [ NAME_KEY ]: 'root' }) // data should be reset after build
    stringifyEqual(builder.build(), { [ NAME_KEY ]: 'root' }) // data should be reset after build
  })

  const EXPECTED_ROOT_OBJECT = {
    [ NAME_KEY ]: 'root',
    [ NAME_SUB_LIST ]: [
      { [ NAME_KEY ]: '0', [ NAME_SUB_LIST ]: [ { [ NAME_KEY ]: '0-0' } ] },
      { [ NAME_KEY ]: '9', [ NAME_SUB_LIST ]: [ { [ NAME_KEY ]: '9-9' } ] },
      { [ NAME_KEY ]: 'u-0', [ NAME_SUB_LIST ]: [ { [ NAME_KEY ]: 'u-0-1' } ] },
      { [ NAME_KEY ]: 'u-1' }
    ]
  }

  it('createBuilder (with unlinked key)', () => {
    const builder = createBuilder('root')
    builder.add('0', 0, 'root')
    builder.add('0-0', 0, '0')
    builder.add('9-9', 9, '9')
    builder.add('9', 9, 'root')
    builder.add('u-0', 0, 'unlinked-key-0')
    builder.add('u-0-1', 0, 'u-0')
    builder.add('u-1', 0, 'unlinked-key-1')
    const rootObject = builder.build()
    stringifyEqual(rootObject, EXPECTED_ROOT_OBJECT)
    stringifyEqual(parse(stringify(rootObject[ NAME_SUB_LIST ])), EXPECTED_ROOT_OBJECT[ NAME_SUB_LIST ])

    stringifyEqual(builder.build(), { [ NAME_KEY ]: 'root' }) // data should be reset after build
    stringifyEqual(builder.build(), { [ NAME_KEY ]: 'root' }) // data should be reset after build
  })

  const EXPECTED_WALK_LIST = [
    [ '0', 0, 'root' ],
    [ '0-0', 0, '0' ],
    [ '9', 1, 'root' ],
    [ '9-9', 0, '9' ],
    [ 'u-0', 2, 'root' ],
    [ 'u-0-1', 0, 'u-0' ],
    [ 'u-1', 3, 'root' ]
  ]

  it('walkKeyTreeJSON', () => {
    const resultList = []

    walkKeyTreeJSON(EXPECTED_ROOT_OBJECT, ([ node, index, upperKey ]) => {
      resultList.push([ node[ NAME_KEY ], index, upperKey ])
    })

    stringifyEqual(resultList, EXPECTED_WALK_LIST)
  })
})
