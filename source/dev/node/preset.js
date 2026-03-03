const REGEXP_TEST_PATH = /[.-]test(?:\.[^/\\]+|[/\\].*)?$/

// preset rule for path naming:
//   - test path:
//     - `*/*.test/*` or `*/*-test/*` for directory
//     - `*/*.test` for test resource|data file
//     - `*/*.test.*` or `*/*-test.*` for test file with extension
//   - source path:
//     - all non-test file, and note with this rule the following is NOT test file also:
//     - `*/test/*` or `*/test.*` to avoid unintended matching, always add a test intention to the path name
//     - `*/.test.` a strange name anyway

const FILTER_TEST_PATH = (path) => REGEXP_TEST_PATH.test(path)
const FILTER_SOURCE_PATH = (path) => !REGEXP_TEST_PATH.test(path)

const FILTER_JS_FILE = (path) => path.endsWith('.js')
const FILTER_TEST_JS_FILE = (path) => FILTER_JS_FILE(path) && FILTER_TEST_PATH(path)
const FILTER_SOURCE_JS_FILE = (path) => FILTER_JS_FILE(path) && !FILTER_TEST_PATH(path)

export {
  FILTER_TEST_PATH,
  FILTER_SOURCE_PATH,

  FILTER_JS_FILE,
  FILTER_TEST_JS_FILE,
  FILTER_SOURCE_JS_FILE
}
