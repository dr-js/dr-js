const describe = (value) => {
  const valueType = typeof (value)
  let valueString
  if (valueType === 'function') valueString = '() => { ... }'
  else try { valueString = JSON.stringify(value) } catch (error) { valueString = `{ ... }` }
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
const DECIMAL_PICO = Math.pow(10, -12) // pico p 10^−12
const DECIMAL_NANO = Math.pow(10, -9) // nano n 10^−9
const DECIMAL_MICRO = Math.pow(10, -6) // micro μ 10^−6
const DECIMAL_MILLI = Math.pow(10, -3) // milli m 10^−3
const DECIMAL_BASE = Math.pow(10, 0) // BASE @ 10^0
const DECIMAL_KILO = Math.pow(10, 3) // kilo k 10^3
const DECIMAL_MEGA = Math.pow(10, 6) // mega M 10^6
const DECIMAL_GIGA = Math.pow(10, 9) // giga G 10^9
const DECIMAL_TERA = Math.pow(10, 12) // tera T 10^12
const DECIMAL_PETA = Math.pow(10, 15) // peta P 10^15
const DECIMAL_EXA = Math.pow(10, 18) // exa E 10^18
const decimal = (value) => {
  const abs = Math.abs(value) * OVER_THRESHOLD
  return abs === 0 ? `0`
    : abs < DECIMAL_NANO ? `${(value / DECIMAL_PICO).toFixed(2)}pico`
      : abs < DECIMAL_MICRO ? `${(value / DECIMAL_NANO).toFixed(2)}nano`
        : abs < DECIMAL_MILLI ? `${(value / DECIMAL_MICRO).toFixed(2)}micro`
          : abs < DECIMAL_BASE ? `${(value / DECIMAL_MILLI).toFixed(2)}milli`
            : abs < DECIMAL_KILO ? `${(value / DECIMAL_BASE).toFixed(2)}`
              : abs < DECIMAL_MEGA ? `${(value / DECIMAL_KILO).toFixed(2)}kilo`
                : abs < DECIMAL_GIGA ? `${(value / DECIMAL_MEGA).toFixed(2)}mega`
                  : abs < DECIMAL_TERA ? `${(value / DECIMAL_GIGA).toFixed(2)}giga`
                    : abs < DECIMAL_PETA ? `${(value / DECIMAL_TERA).toFixed(2)}tera`
                      : abs < DECIMAL_EXA ? `${(value / DECIMAL_PETA).toFixed(2)}peta`
                        : `${(value / DECIMAL_EXA).toFixed(2)}exa`
}

const TIME_S = 1000
const TIME_M = 1000 * 60
const TIME_H = 1000 * 60 * 60
const TIME_D = 1000 * 60 * 60 * 24
const time = (value) => { // value should be msec
  const abs = Math.abs(value) * OVER_THRESHOLD
  return abs < TIME_S ? `${Math.floor(value)}ms`
    : abs < TIME_M ? `${(value / TIME_S).toFixed(2)}s`
      : abs < TIME_H ? `${(value / TIME_M).toFixed(2)}m`
        : abs < TIME_D ? `${(value / TIME_H).toFixed(2)}h`
          : `${(value / TIME_D).toFixed(2)}d`
}

// https://en.wikipedia.org/wiki/Binary_prefix
const BINARY_K = Math.pow(2, 10) // kibi | Ki (IEC) | K (JEDEC)
const BINARY_M = Math.pow(2, 20) // mebi | Mi (IEC) | M (JEDEC)
const BINARY_G = Math.pow(2, 30) // gibi | Gi (IEC) | G (JEDEC)
const BINARY_T = Math.pow(2, 40) // tebi | Ti (IEC)
const binary = (value) => {
  const abs = Math.abs(value) * OVER_THRESHOLD
  return abs < BINARY_K ? `${Math.floor(value)}`
    : abs < BINARY_M ? `${(value / BINARY_K).toFixed(2)}Ki`
      : abs < BINARY_G ? `${(value / BINARY_M).toFixed(2)}Mi`
        : abs < BINARY_T ? `${(value / BINARY_G).toFixed(2)}Gi`
          : `${(value / BINARY_T).toFixed(2)}Ti`
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
const replaceEscapeHTML = (substring) => ESCAPE_HTML_MAP[ substring ] || substring
const escapeHTML = (text) => text && text.replace(/[&<>]/g, replaceEscapeHTML)

const UNESCAPE_HTML_MAP = { '&amp;': '&', '&lt;': '<', '&gt;': '>' }
const replaceUnescapeHTML = (substring) => UNESCAPE_HTML_MAP[ substring ] || substring
const unescapeHTML = (text) => text && text.replace(/(&amp;|&lt;|&gt;)/g, replaceUnescapeHTML)

// remove XML invalid Char
const removeInvalidCharXML = (text) => text.replace(/[^\x09\x0A\x0D\x20-\xFF\x85\xA0-\uD7FF\uE000-\uFDCF\uFDE0-\uFFFD]/gm, '') // eslint-disable-line no-control-regex

const stringIndentLine = (string, indentString = '  ') => `${indentString}${string.replace(/\n/g, `\n${indentString}`)}`
const stringListJoinCamelCase = (stringList, fromIndex = 1) => stringList.reduce(
  (o, string, index) => (index >= fromIndex)
    ? o + string[ 0 ].toUpperCase() + string.slice(1)
    : o + string,
  ''
)

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
  stringListJoinCamelCase
}
