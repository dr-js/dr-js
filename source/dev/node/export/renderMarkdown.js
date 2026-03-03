import { relative } from 'node:path'
import { padTable } from 'source/common/format.js'
import { indentLine, forEachRegExpExec } from 'source/common/string.js'
import { toPosixPath } from 'source/node/fs/Path.js'
import { HOIST_LIST_KEY, EXPORT_LIST_KEY, EXPORT_HOIST_LIST_KEY } from './generate.js'

// check: https://gist.github.com/asabaylus/3071099
// [Export Path](#export-path)
// [Bin Option Format](#bin-option-format)
// [Strange   Format](#strange---format)
// [Strange , , Format ALT](#strange---format-alt)
const getMarkdownHeaderLink = (
  text,
  link = text.trim().toLowerCase()
    // borrow from marked: https://github.com/markedjs/marked/blob/v0.8.2/lib/marked.js#L1046
    .replace(/<[!/a-z].*?>/ig, '')
    .replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, '')
    .replace(/\s/g, '-')
) => `[${text}](#${link})`

const REGEXP_MARKDOWN_HEADER = /^#{1,6}(.+?)#*$/gm // TODO: will mis-match comment in bash, use `marked`?
const matchMarkdownHeader = (string) => {
  const headerTextList = []
  forEachRegExpExec(REGEXP_MARKDOWN_HEADER, string, ([ , group1 ]) => {
    const headerText = group1.trim()
    headerText && headerTextList.push(headerText)
  })
  return headerTextList
}
const renderMarkdownAutoAppendHeaderLink = (...markdownStringList) => {
  const headerTextList = matchMarkdownHeader(markdownStringList.join('\n'))
  return headerTextList.length ? [
    ...headerTextList.map((text) => `* ${getMarkdownHeaderLink(text)}`),
    '',
    ...markdownStringList
  ] : []
}

const escapeMarkdownLink = (name) => name.replace(/_/g, '\\_')
const getMarkdownFileLink = (path) => `📄 [${escapeMarkdownLink(path)}](${path})`
const getMarkdownDirectoryLink = (path) => `📁 [${escapeMarkdownLink(path).replace(/\/*$/, '/')}](${path})`

const renderMarkdownBlockQuote = (text) => [
  '> ```',
  indentLine(text, '> '),
  '> ```'
]

const renderMarkdownTable = ({
  headerRow = [],
  cellRowList = [],
  padFuncList = [],
  table = [
    headerRow,
    headerRow.map((_, index) => {
      const pad = padFuncList[ index ]
      return pad === 'L' ? ':----' : pad === 'R' ? '----:' : ':---:'
    }),
    ...cellRowList
  ]
}) => [
  '', // add empty line '' for better parser support
  ...padTable({ table, padFuncList, cellPad: ' | ', rowPad: '\n' }).split('\n')
    .map((text) => `| ${text} |`)
]

const renderMarkdownExportPath = ({ exportInfoMap, rootPath }) => Object.entries(exportInfoMap)
  .reduce((textList, [ path, value ]) => {
    value[ EXPORT_LIST_KEY ] && textList.push(
      `+ ${getMarkdownFileLink(`${toPosixPath(relative(rootPath, path))}.js`)}`,
      `  - ${value[ EXPORT_LIST_KEY ].map((text) => `\`${text}\``).join(', ')}`
    )
    return textList
  }, [])

const renderMarkdownExportTree = ({ exportInfo, routeList }) => Object.entries(exportInfo)
  .reduce((textList, [ key, value ]) => {
    if (key === HOIST_LIST_KEY) {
      // skip
    } else if (key === EXPORT_LIST_KEY || key === EXPORT_HOIST_LIST_KEY) {
      textList.push(`- ${value.map((text) => `\`${text}\``).join(', ')}`)
    } else {
      const childTextList = renderMarkdownExportTree({ exportInfo: value, routeList: [ ...routeList, key ] })
      childTextList.length && textList.push(`- **${key}**`, ...childTextList.map((text) => `  ${text}`))
    }
    return textList
  }, [])

export { // TODO: NOTE: all func name like `renderMarkdown*` should return Array, others should return String
  getMarkdownHeaderLink,
  escapeMarkdownLink,
  getMarkdownFileLink, getMarkdownDirectoryLink,

  renderMarkdownAutoAppendHeaderLink,
  renderMarkdownBlockQuote,
  renderMarkdownTable,
  renderMarkdownExportPath,
  renderMarkdownExportTree
}
