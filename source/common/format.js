const describe = (value) => {
  const valueType = typeof (value)
  const valueString = valueType === 'function' ? 'function' : JSON.stringify(value)
  return `<${valueType}> ${valueString}`
}

const UP_THRESHOLD = 1.5

const TIME_SEC = 1000
const TIME_MIN = 60 * TIME_SEC
const TIME_HOUR = 60 * TIME_MIN
const TIME_DAY = 24 * TIME_HOUR
// value should be msec
const time = (value) => value < TIME_SEC * UP_THRESHOLD ? `${Math.floor(value)}ms`
  : value < TIME_MIN * UP_THRESHOLD ? `${(value / TIME_SEC).toFixed(2)}s`
    : value < TIME_HOUR * UP_THRESHOLD ? `${(value / TIME_MIN).toFixed(2)}m`
      : value < TIME_DAY * UP_THRESHOLD ? `${(value / TIME_HOUR).toFixed(2)}h`
        : `${(value / TIME_DAY).toFixed(2)}d`

// https://en.wikipedia.org/wiki/Binary_prefix
const BINARY_KIBI = 1 << 10
const BINARY_MEBI = 1 << 20
const BINARY_GIBI = 1 << 30
const binary = (value) => value < BINARY_KIBI * UP_THRESHOLD ? `${Math.floor(value)}`
  : value < BINARY_MEBI * UP_THRESHOLD ? `${(value / BINARY_KIBI).toFixed(2)}Ki`
    : value < BINARY_GIBI * UP_THRESHOLD ? `${(value / BINARY_MEBI).toFixed(2)}Mi`
      : `${(value / BINARY_GIBI).toFixed(2)}Gi`

const DEFAULT_PAD_FUNC = (text, maxWidth) => text.padStart(maxWidth)
const padTable = ({ table, padFuncList = [], cellPad = '|', rowPad = '\n' }) => {
  const widthMaxList = [] // get max width for each cell
  table.forEach((rowList) => rowList.forEach((text, index) => (widthMaxList[ index ] = Math.max(text.length, widthMaxList[ index ] || 0))))
  widthMaxList.forEach((v, index) => { padFuncList[ index ] = padFuncList[ index ] || DEFAULT_PAD_FUNC })
  return table.map((rowList) => rowList.map((text, index) => (padFuncList[ index ](text, widthMaxList[ index ]))).join(cellPad)).join(rowPad)
}

const ESCAPE_HTML_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;' }
const replaceEscapeHTML = (substring) => ESCAPE_HTML_MAP[ substring ] || substring
const escapeHTML = (text) => text && text.replace(/[&<>]/g, replaceEscapeHTML)

const UNESCAPE_HTML_MAP = { '&amp;': '&', '&lt;': '<', '&gt;': '>' }
const replaceUnescapeHTML = (substring) => UNESCAPE_HTML_MAP[ substring ] || substring
const unescapeHTML = (text) => text && text.replace(/(&amp;|&lt;|&gt;)/g, replaceUnescapeHTML)

const stringIndentLine = (string, indentString = '  ') => `${indentString}${string.split('\n').join(`\n${indentString}`)}`
const stringListJoinCamelCase = (stringList, fromIndex = 1) => stringList.reduce(
  (o, string, index) => (index >= fromIndex)
    ? o + string[ 0 ].toUpperCase() + string.slice(1)
    : o + string,
  ''
)

export {
  describe,

  time,
  binary,
  padTable,

  escapeHTML,
  unescapeHTML,

  stringIndentLine,
  stringListJoinCamelCase
}
