import { stringifyEqual } from 'source/common/verify.js'

import {
  FILTER_TEST_PATH,
  FILTER_SOURCE_PATH,

  FILTER_JS_FILE,
  FILTER_TEST_JS_FILE,
  FILTER_SOURCE_JS_FILE
} from './preset.js'

const { describe, it } = globalThis

const TEST_PATH_LIST = []
const EXPECT_LIST = []

;[
  [ 'aaa', 'source' ],
  [ 'aaa.js', 'source.js' ],
  [ 'aaa.md', 'source.md' ],
  [ 'aaa.test', 'test' ],
  [ 'aaa-test', 'test' ],
  [ 'aaa.test.js', 'test.js' ],
  [ 'aaa-test.js', 'test.js' ],
  [ 'aaa-test.md', 'test.md' ],
  [ 'aaa.test.md', 'test.md' ],

  [ 'bbb.test/aaa', 'test' ],
  [ 'bbb.test/aaa.js', 'test.js' ],
  [ 'bbb.test/aaa.md', 'test.md' ],
  [ 'bbb.test/aaa.test', 'test' ],
  [ 'bbb.test/aaa-test', 'test' ],
  [ 'bbb.test/aaa.test.js', 'test.js' ],
  [ 'bbb.test/aaa-test.js', 'test.js' ],
  [ 'bbb.test/aaa.test.md', 'test.md' ],
  [ 'bbb.test/aaa-test.md', 'test.md' ],

  [ 'bbb-test/aaa', 'test' ],
  [ 'bbb-test/aaa.js', 'test.js' ],
  [ 'bbb-test/aaa.md', 'test.md' ],
  [ 'bbb-test/aaa.test', 'test' ],
  [ 'bbb-test/aaa-test', 'test' ],
  [ 'bbb-test/aaa.test.js', 'test.js' ],
  [ 'bbb-test/aaa-test.js', 'test.js' ],
  [ 'bbb-test/aaa.test.md', 'test.md' ],
  [ 'bbb-test/aaa-test.md', 'test.md' ],

  // must have leading `[.-]`
  [ 'test/aaa', 'source' ],
  [ 'test/aaa.js', 'source.js' ],
  [ 'test/aaa.md', 'source.md' ],
  [ 'test/aaa.test', 'test' ],
  [ 'test/aaa-test', 'test' ],
  [ 'test/aaa.test.js', 'test.js' ],
  [ 'test/aaa-test.js', 'test.js' ],
  [ 'test/aaa.test.md', 'test.md' ],
  [ 'test/aaa-test.md', 'test.md' ],

  // must have leading `[.-]`
  [ 'aaa/bbb/test', 'source' ],
  [ 'aaa/bbb/test.', 'source' ],
  [ 'aaa/bbb/test.js', 'source.js' ],
  [ 'aaa/bbb/test.md', 'source.md' ],
  [ 'aaa/bbb/test/test', 'source' ],
  [ 'aaa/bbb/test/test.js', 'source.js' ],
  [ 'aaa/bbb/test/test.md', 'source.md' ],

  // must have file extension
  [ 'aaa/bbb/.test.', 'source' ],
  [ 'aaa/bbb/-test.', 'source' ],
  [ 'aaa/bbb/.test./ccc', 'source' ],
  [ 'aaa/bbb/-test./ccc', 'source' ],

  [ 'EOF', 'source' ]
].forEach(([ testPath, expect ]) => {
  TEST_PATH_LIST.push(testPath)
  EXPECT_LIST.push(expect)
})

describe('Preset', () => {
  it('FILTER_TEST_PATH()', () => {
    stringifyEqual(TEST_PATH_LIST.map(FILTER_TEST_PATH), EXPECT_LIST.map((v) => v.startsWith('test')))
  })
  it('FILTER_SOURCE_PATH()', () => {
    stringifyEqual(TEST_PATH_LIST.map(FILTER_SOURCE_PATH), EXPECT_LIST.map((v) => v.startsWith('source')))
  })

  it('FILTER_JS_FILE()', () => {
    stringifyEqual(TEST_PATH_LIST.map(FILTER_JS_FILE), EXPECT_LIST.map((v) => v.endsWith('.js')))
  })
  it('FILTER_TEST_JS_FILE()', () => {
    stringifyEqual(TEST_PATH_LIST.map(FILTER_TEST_JS_FILE), EXPECT_LIST.map((v) => v === 'test.js'))
  })
  it('FILTER_SOURCE_JS_FILE()', () => {
    stringifyEqual(TEST_PATH_LIST.map(FILTER_SOURCE_JS_FILE), EXPECT_LIST.map((v) => v === 'source.js'))
  })
})
