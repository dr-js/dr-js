const describe = (value) => {
  const valueType = typeof (value)
  const valueString = valueType === 'function' ? 'function' : JSON.stringify(value)
  return `<${valueType}> ${valueString}`
}

const OVER_THRESHOLD = 0.75

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
const BINARY_K = 1 << 10 // kibi
const BINARY_M = 1 << 20 // mebi
const BINARY_G = 1 << 30 // gibi
const binary = (value) => {
  const abs = Math.abs(value) * OVER_THRESHOLD
  return abs < BINARY_K ? `${Math.floor(value)}`
    : abs < BINARY_M ? `${(value / BINARY_K).toFixed(2)}K`
      : abs < BINARY_G ? `${(value / BINARY_M).toFixed(2)}M`
        : `${(value / BINARY_G).toFixed(2)}G`
}

const padTable = ({
  table, // table: list of row, row: list of cell, like: [ [], [] ]
  padFuncList = [],
  cellPad = '|',
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
const applyCellPad = (text, maxWidth, padFunc) => (!padFunc || padFunc === 'R') ? text.padStart(maxWidth) // right align
  : padFunc === 'L' ? text.padEnd(maxWidth) // left align
    : padFunc(text, maxWidth)

const ESCAPE_HTML_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;' }
const replaceEscapeHTML = (substring) => ESCAPE_HTML_MAP[ substring ] || substring
const escapeHTML = (text) => text && text.replace(/[&<>]/g, replaceEscapeHTML)

const UNESCAPE_HTML_MAP = { '&amp;': '&', '&lt;': '<', '&gt;': '>' }
const replaceUnescapeHTML = (substring) => UNESCAPE_HTML_MAP[ substring ] || substring
const unescapeHTML = (text) => text && text.replace(/(&amp;|&lt;|&gt;)/g, replaceUnescapeHTML)

const stringIndentLine = (string, indentString = '  ') => `${indentString}${string.replace(/\n/g, `\n${indentString}`)}`
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
