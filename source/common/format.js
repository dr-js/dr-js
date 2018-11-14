const describe = (value) => {
  const valueType = typeof (value)
  let valueString
  if (valueType === 'function') valueString = '()=>{...}'
  else try { valueString = JSON.stringify(value) } catch (error) { valueString = `{...}` }
  return `<${valueType}> ${valueString}`
}

const percent = (value) => `${(value * 100).toFixed(2)}%`

const mediaTime = (value) => { // in second
  const minute = String(Math.floor(value / 60))
  const second = String(Math.floor(value % 60))
  return `${minute.padStart(2, '0')}:${second.padStart(2, '0')}`
}

const OVER_THRESHOLD = 0.75

// https://en.wikipedia.org/wiki/Metric_prefix
const DECIMAL_PICO_ = 0.000000000001 // ======= pico    p   10^−12
const DECIMAL_NANO_ = 0.000000001// =========== nano    n   10^−9
const DECIMAL_MICRO = 0.000001 // ============= micro   μ   10^−6
const DECIMAL_MILLI = 0.001 // ================ milli   m   10^−3
const DECIMAL_BASE_ = 1 // ==================== BASE    @   10^0
const DECIMAL_KILO_ = 1000 // ================= kilo    k   10^3
const DECIMAL_MEGA_ = 1000000 // ============== mega    M   10^6
const DECIMAL_GIGA_ = 1000000000 // =========== giga    G   10^9
const DECIMAL_TERA_ = 1000000000000 // ======== tera    T   10^12
const DECIMAL_PETA_ = 1000000000000000 // ===== peta    P   10^15
const DECIMAL_EXA__ = 1000000000000000000 // == exa     E   10^18
const decimal = (value) => {
  const abs = Math.abs(value) * OVER_THRESHOLD
  return abs === 0 ? `0`
    : abs < DECIMAL_NANO_ ? `${(value / DECIMAL_PICO_).toFixed(2)}pico`
      : abs < DECIMAL_MICRO ? `${(value / DECIMAL_NANO_).toFixed(2)}nano`
        : abs < DECIMAL_MILLI ? `${(value / DECIMAL_MICRO).toFixed(2)}micro`
          : abs < DECIMAL_BASE_ ? `${(value / DECIMAL_MILLI).toFixed(2)}milli`
            : abs < DECIMAL_KILO_ ? `${(value / DECIMAL_BASE_).toFixed(2)}`
              : abs < DECIMAL_MEGA_ ? `${(value / DECIMAL_KILO_).toFixed(2)}kilo`
                : abs < DECIMAL_GIGA_ ? `${(value / DECIMAL_MEGA_).toFixed(2)}mega`
                  : abs < DECIMAL_TERA_ ? `${(value / DECIMAL_GIGA_).toFixed(2)}giga`
                    : abs < DECIMAL_PETA_ ? `${(value / DECIMAL_TERA_).toFixed(2)}tera`
                      : abs < DECIMAL_EXA__ ? `${(value / DECIMAL_PETA_).toFixed(2)}peta`
                        : `${(value / DECIMAL_EXA__).toFixed(2)}exa`
}

const TIME_SEC_ = 1000
const TIME_MIN_ = 1000 * 60
const TIME_HOUR = 1000 * 60 * 60
const TIME_DAY_ = 1000 * 60 * 60 * 24
const time = (value) => { // value should be msec
  const abs = Math.abs(value) * OVER_THRESHOLD
  return abs < TIME_SEC_ ? `${Math.floor(value)}ms`
    : abs < TIME_MIN_ ? `${(value / TIME_SEC_).toFixed(2)}s`
      : abs < TIME_HOUR ? `${(value / TIME_MIN_).toFixed(2)}m`
        : abs < TIME_DAY_ ? `${(value / TIME_HOUR).toFixed(2)}h`
          : `${(value / TIME_DAY_).toFixed(2)}d`
}

// https://en.wikipedia.org/wiki/Binary_prefix
const BINARY_KIBI = 0b10000000000 // ================================= kibi   Ki(IEC)   K(JEDEC)    2^10
const BINARY_MEBI = 0b100000000000000000000 // ======================= mebi   Mi(IEC)   M(JEDEC)    2^20
const BINARY_GIBI = 0b1000000000000000000000000000000 // ============= gibi   Gi(IEC)   G(JEDEC)    2^30
const BINARY_TEBI = 0b10000000000000000000000000000000000000000 // === tebi   Ti(IEC)   T(JEDEC)    2^40
const binary = (value) => {
  const abs = Math.abs(value) * OVER_THRESHOLD
  return abs < BINARY_KIBI ? `${Math.floor(value)}`
    : abs < BINARY_MEBI ? `${(value / BINARY_KIBI).toFixed(2)}Ki`
      : abs < BINARY_GIBI ? `${(value / BINARY_MEBI).toFixed(2)}Mi`
        : abs < BINARY_TEBI ? `${(value / BINARY_GIBI).toFixed(2)}Gi`
          : `${(value / BINARY_TEBI).toFixed(2)}Ti`
}

const padTable = ({
  table, // table: list of row, row: list of cell, like: [ [], [] ]
  padFuncList = [],
  cellPad = ' | ',
  rowPad = '\n'
}) => {
  const widthMaxList = [] // get max width for each cell
  table.forEach((rowList) => rowList.forEach((text, index) => (widthMaxList[ index ] = Math.max(String(text).length, widthMaxList[ index ] || 0))))
  return table.map(
    (rowList) => rowList.map(
      (text, index) => applyCellPad(String(text), widthMaxList[ index ], padFuncList[ index ])
    ).join(cellPad)
  ).join(rowPad)
}
const applyCellPad = (text, maxWidth, padFunc) => (!padFunc || padFunc === 'L') ? text.padEnd(maxWidth) // left align [default]
  : padFunc === 'R' ? text.padStart(maxWidth) // right align
    : padFunc(text, maxWidth)

const ESCAPE_HTML_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;' }
const REGEXP_ESCAPE_HTML = /[&<>]/g
const replaceEscapeHTML = (substring) => ESCAPE_HTML_MAP[ substring ] || substring
const escapeHTML = (text) => text && text.replace(REGEXP_ESCAPE_HTML, replaceEscapeHTML)

const UNESCAPE_HTML_MAP = { '&amp;': '&', '&lt;': '<', '&gt;': '>' }
const REGEXP_UNESCAPE_HTML = /(&amp;|&lt;|&gt;)/g
const replaceUnescapeHTML = (substring) => UNESCAPE_HTML_MAP[ substring ] || substring
const unescapeHTML = (text) => text && text.replace(REGEXP_UNESCAPE_HTML, replaceUnescapeHTML)

// remove XML invalid Char
const REGEXP_INVALID_CHAR_XML = /[^\x09\x0A\x0D\x20-\xFF\x85\xA0-\uD7FF\uE000-\uFDCF\uFDE0-\uFFFD]/gm // eslint-disable-line no-control-regex
const removeInvalidCharXML = (text) => text.replace(REGEXP_INVALID_CHAR_XML, '')

const REGEXP_INDENT_LINE = /\n/g
const stringIndentLine = (string, indentString = '  ', indentStringStart = indentString) => `${indentStringStart}${string.replace(REGEXP_INDENT_LINE, `\n${indentString}`)}`

const stringIndentList = (
  title,
  itemList = [],
  indentStringStart = '  - ',
  indentString = ' '.repeat(indentStringStart.length)
) => [
  title,
  ...itemList.map((item) => stringIndentLine(item, indentString, indentStringStart))
].join('\n')

const stringAutoEllipsis = (string = '', limit = 64, head = 32, tail = 16) => string.length > limit
  ? `${string.slice(0, head)}...${tail > 0 ? string.slice(-tail) : ''} (+${string.length - head - tail})`
  : string
const stringListJoinCamelCase = (stringList, fromIndex = 1) => stringList.reduce(
  (o, string, index) => (index >= fromIndex)
    ? o + string[ 0 ].toUpperCase() + string.slice(1)
    : o + string,
  ''
)

const prettyStringifyJSON = (value, level = 2) => {
  const resultList = []
  prettyStringifyJSONSwitch(resultList, value, Math.max(level, 0) || 0, '')
  return resultList.join('')
}
const prettyStringifyJSONSwitch = (resultList, value, level, padString) => {
  __DEV__ && console.log(' - - Switch', JSON.stringify({ level, padString }))
  if (level >= 1 && value) {
    if (Array.isArray(value)) return prettyStringifyJSONArray(resultList, value, level, padString)
    if (typeof (value) === 'object') return prettyStringifyJSONObject(resultList, value, level, padString)
  }
  resultList.push(JSON.stringify(value))
}
const prettyStringifyJSONObject = (resultList, object, level, padString) => {
  const entryList = Object.entries(object)
  __DEV__ && console.log(' - - Object', JSON.stringify({ level, padString, entryListLength: entryList.length }))
  if (entryList.length === 0) return resultList.push('{}')
  resultList.push('{\n')
  const nextLevel = level - 1
  const nextPadString = `${padString}  `
  entryList.forEach(([ key, value ]) => {
    resultList.push(nextPadString, JSON.stringify(key), ': ')
    prettyStringifyJSONSwitch(resultList, value, nextLevel, nextPadString)
    resultList.push(',\n')
  })
  resultList[ resultList.length - 1 ] = `\n${padString}}`
}
const prettyStringifyJSONArray = (resultList, array, level, padString) => {
  __DEV__ && console.log(' - - Array', JSON.stringify({ level, padString, arrayLength: array.length }))
  if (array.length === 0) return resultList.push('[]')
  resultList.push('[\n')
  const nextLevel = level - 1
  const nextPadString = `${padString}  `
  array.forEach((value) => {
    resultList.push(nextPadString)
    prettyStringifyJSONSwitch(resultList, value, nextLevel, nextPadString)
    resultList.push(',\n')
  })
  resultList[ resultList.length - 1 ] = `\n${padString}]`
}

export {
  describe,

  percent,
  mediaTime,

  decimal,
  time,
  binary,

  padTable,

  escapeHTML,
  unescapeHTML,
  removeInvalidCharXML,

  stringIndentLine,
  stringIndentList,

  stringAutoEllipsis,
  stringListJoinCamelCase,

  prettyStringifyJSON
}
