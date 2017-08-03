const KiB = 1 << 10
const MiB = 1 << 20
const GiB = 1 << 30
const UP_THRESHOLD = 1.5
const binaryPrefix = (value) => value < KiB * UP_THRESHOLD ? `${value}`
  : value < MiB * UP_THRESHOLD ? `${(value / KiB).toFixed(2)}Ki`
    : value < GiB * UP_THRESHOLD ? `${(value / MiB).toFixed(2)}Mi`
      : `${(value / GiB).toFixed(2)}Gi`

const ESCAPE_HTML_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;' }
const replaceEscapeHTML = (substring) => ESCAPE_HTML_MAP[ substring ] || substring
const escapeHTML = (text) => text && text.replace(/[&<>]/g, replaceEscapeHTML)

const UNESCAPE_HTML_MAP = { '&amp;': '&', '&lt;': '<', '&gt;': '>' }
const replaceUnescapeHTML = (substring) => UNESCAPE_HTML_MAP[ substring ] || substring
const unescapeHTML = (text) => text && text.replace(/(&amp;|&lt;|&gt;)/g, replaceUnescapeHTML)

export {
  binaryPrefix,
  escapeHTML,
  unescapeHTML
}
