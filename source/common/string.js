const REGEXP_INDENT_LINE = /\n/g
const indentLine = (string, indentString = '  ', indentStringStart = indentString) => `${indentStringStart}${string.replace(REGEXP_INDENT_LINE, `\n${indentString}`)}`

const indentList = (
  title,
  itemList = [],
  indentStringStart = '  - ',
  indentString = ' '.repeat(indentStringStart.length)
) => [
  title,
  ...itemList.map((item) => indentLine(item, indentString, indentStringStart))
].join('\n')

const autoEllipsis = (string = '', limit = 64, head = 32, tail = 16) => string.length > limit
  ? `${string.slice(0, head)}...${tail > 0 ? string.slice(-tail) : ''} (+${string.length - head - tail})`
  : string

const REGEXP_SPLIT_CAMEL_CASE_TEST = /[^A-Z]/
const REGEXP_SPLIT_CAMEL_CASE = /([^A-Z]|[A-Z]{2,})([A-Z])/g
const splitCamelCase = (string) => REGEXP_SPLIT_CAMEL_CASE_TEST.test(string) ? string.replace(REGEXP_SPLIT_CAMEL_CASE, '$1 $2').split(' ') : [ string ]
const splitSnakeCase = (string) => string.split('_')
const splitKebabCase = (string) => string.split('-')

const joinCamelCase = (stringList, fromIndex = 1) => stringList.reduce((o, string, index) => o + (index < fromIndex ? string : capFirst(string)), '')
const joinSnakeCase = (stringList) => stringList.join('_').toUpperCase() // SCREAMING_SNAKE_CASE
const joinKebabCase = (stringList) => stringList.join('-').toLowerCase()

const capFirst = (string) => string.charAt(0).toUpperCase() + string.slice(1)

if (__DEV__) { // code to generate
  const ESCAPE_HTML_MAP = {}
  const UNESCAPE_HTML_MAP = {}

  const ESCAPE_LIST = []
  const UNESCAPE_LIST = []
  const BASIC_HTML_ESCAPE_LIST = [
    `" #34 quot`,
    `& #38 amp`,
    // apos may not be usable in HTML4 Browser, check:
    //   https://stackoverflow.com/questions/9187946/escaping-inside-html-tag-attribute-value
    //   https://stackoverflow.com/questions/2083754/why-shouldnt-apos-be-used-to-escape-single-quotes
    `' #39 apos`,
    `< #60 lt`,
    `> #62 gt`
  ]
  BASIC_HTML_ESCAPE_LIST.forEach((value) => {
    const [ char, decimal, named ] = value.split(' ')
    const decimalEntity = `&${decimal};`
    const namedEntity = `&${named};`
    ESCAPE_HTML_MAP[ char ] = decimalEntity
    UNESCAPE_HTML_MAP[ decimalEntity ] = char
    UNESCAPE_HTML_MAP[ namedEntity ] = char
    ESCAPE_LIST.push(char)
    UNESCAPE_LIST.push(decimal, named)
  })

  const REGEXP_ESCAPE_HTML = new RegExp(`[${ESCAPE_LIST.join('')}]`, 'g')
  const REGEXP_UNESCAPE_HTML = new RegExp(`&(?:${UNESCAPE_LIST.join('|')});`, 'g')

  console.log({
    ESCAPE_HTML_MAP,
    UNESCAPE_HTML_MAP,
    REGEXP_ESCAPE_HTML,
    REGEXP_UNESCAPE_HTML
  })
}

const ESCAPE_HTML_MAP = {
  '"': '&#34;',
  '&': '&#38;',
  "'": '&#39;',
  '<': '&#60;',
  '>': '&#62;'
}
const REGEXP_ESCAPE_HTML = /["&'<>]/g
const replaceEscapeHTML = (string) => ESCAPE_HTML_MAP[ string ] || string
const escapeHTML = (string) => string && string.replace(REGEXP_ESCAPE_HTML, replaceEscapeHTML)

const UNESCAPE_HTML_MAP = {
  '&#34;': '"',
  '&quot;': '"',
  '&#38;': '&',
  '&amp;': '&',
  '&#39;': "'",
  '&apos;': "'",
  '&#60;': '<',
  '&lt;': '<',
  '&#62;': '>',
  '&gt;': '>'
}
const REGEXP_UNESCAPE_HTML = /&(?:#34|quot|#38|amp|#39|apos|#60|lt|#62|gt);/g
const replaceUnescapeHTML = (string) => UNESCAPE_HTML_MAP[ string ] || string
const unescapeHTML = (string) => string && string.replace(REGEXP_UNESCAPE_HTML, replaceUnescapeHTML)

// remove XML invalid Char
const REGEXP_INVALID_CHAR_XML = /[^\x09\x0A\x0D\x20-\xFF\x85\xA0-\uD7FF\uE000-\uFDCF\uFDE0-\uFFFD]/gm // eslint-disable-line no-control-regex
const removeInvalidCharXML = (string) => string.replace(REGEXP_INVALID_CHAR_XML, '')

export {
  indentLine,
  indentList,
  autoEllipsis,

  splitCamelCase, joinCamelCase,
  splitSnakeCase, joinSnakeCase,
  splitKebabCase, joinKebabCase,

  escapeHTML, unescapeHTML,
  removeInvalidCharXML
}
