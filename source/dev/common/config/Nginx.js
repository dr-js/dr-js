import { typeNameOf } from 'source/common/format.js'
import { isBasicObject, isBasicArray, isString, isNumber } from 'source/common/check.js'

const stringifyNginxConf = (object) => {
  const KEY_MULTILINE = [
    'log_format', 'access_log',
    'index',
    'server', 'server_name',
    'valid_referers',
    'try_files',
    'gzip_types', 'brotli_types'
  ]

  const it = (indent, text) => `${indent}${text}`
  const t8 = (text) => text.padEnd(8 * (Math.floor(text.length / 8) || 1) + 8, ' ')
  const it24 = (indent, text) => text ? t8(it(indent, text)).padEnd(24, ' ') : indent
  const multiline = (indent, key, [ firstValue, ...list ]) => {
    const indentKey = it24(indent, key)
    const indentBlank = ' '.repeat(indentKey.length)
    return [ `${indentKey}${firstValue}`, ...list.map((v) => `${indentBlank}${v}`) ].join('\n')
  }

  const dumpObject = (stringList = [], object = {}, indent = '') => {
    for (let [ key, value ] of Object.entries(object)) {
      if (value === undefined) continue // skip this value
      key = key.replace(/#.*/, '') // allow specify multiple same key in json as "key#0", "key#1"
      if (isBasicObject(value)) { // block
        stringList.push(it(indent, `${key} {`))
        dumpObject(stringList, value, indent + '  ')
        stringList.push(it(indent, '}'))
      } else if (isBasicArray(value) || isString(value) || isNumber(value)) { // string of list of string
        value = isBasicArray(value) ? value : [ String(value) ]
        stringList.push((
          KEY_MULTILINE.includes(key.split(/\s/)[ 0 ])
            ? multiline(indent, key, value)
            : [ it24(indent, key), ...value.map(t8) ].join('')
        ).trimEnd() + ';')
      } else throw new Error(`invalid nginx value: ${value} <${typeNameOf(value)}>`)
    }
  }
  const resultList = []
  dumpObject(resultList, object, '')
  return resultList.join('\n')
}

const DEFAULT_MIME = 'application/octet-stream'
const COMMON_MIME_MAP = {
  // basic
  'text/html': 'html htm shtml',
  'text/css': 'css',
  'text/xml': 'xml',
  'text/plain': 'txt',

  // code
  'application/javascript': 'js',
  'application/json': 'json',
  'application/wasm': 'wasm',

  // image
  'image/png': 'png',
  'image/gif': 'gif',
  'image/jpeg': 'jpeg jpg',
  'image/svg+xml': 'svg svgz',
  'image/webp': 'webp',
  'image/x-icon': 'ico',

  // font // https://www.iana.org/assignments/media-types/media-types.xml#font
  'font/woff': 'woff',
  'font/woff2': 'woff2',
  'font/otf': 'otf',
  'font/ttf': 'ttf', // alt: application/x-font-ttf
  'application/vnd.ms-fontobject': 'eot',

  // archive
  'application/x-rar-compressed': 'rar',
  'application/zip': 'zip',

  // media
  'audio/midi': 'mid midi kar',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'video/mp4': 'mp4',
  'video/mpeg': 'mpeg mpg',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'video/x-flv': 'flv',
  'video/x-m4v': 'm4v',
  'video/x-ms-wmv': 'wmv',
  'video/x-msvideo': 'avi'
}
const COMBO_MIME = {
  '#COMBO_MIME': '# COMBO_MIME',
  'default_type': DEFAULT_MIME,
  'types': COMMON_MIME_MAP
}

const COMMON_COMPRESS_MIME_LIST = [ // check 'compressible' in: https://github.com/jshttp/mime-db/tree/v1.45.0#data-structure
  'text/plain',

  // 'text/html', // this is always compressed, so not included of there'll be nginx warning like: `duplicate MIME type "text/html" in .../some-nginx.conf`
  'text/css',
  'text/xml',

  'application/javascript',
  'application/json',
  'application/wasm',

  // 'image/png', // size reduce not that much
  // 'image/gif', // size reduce not that much
  // 'image/jpeg', // size reduce not that much
  'image/svg+xml',
  // 'image/webp', // size reduce not that much
  'image/x-icon', // .ico

  // 'font/woff', // size reduce not that much
  // 'font/woff2', // size reduce not that much
  'font/otf', // .otf
  'font/ttf', // .ttf
  'application/vnd.ms-fontobject' // .eot
]
const COMBO_GZIP = {
  'gzip': 'on',
  'gzip_vary': 'on', // seems mainly for CDN
  'gzip_proxied': 'any',
  'gzip_disable': '"msie6"',
  'gzip_comp_level': 4,
  'gzip_min_length': 128,
  'gzip_types': COMMON_COMPRESS_MIME_LIST
}
const COMBO_BROTLI = { // https://github.com/google/ngx_brotli#configuration-directives
  'brotli': 'on',
  'brotli_comp_level': 4,
  'brotli_min_length': 128,
  'brotli_types': COMMON_COMPRESS_MIME_LIST
}
const COMBO_COMPRESS = {
  '#COMBO_COMPRESS': '# COMBO_COMPRESS',
  ...COMBO_GZIP,
  ...COMBO_BROTLI
}

const COMBO_GZIP_STATIC = { 'gzip_static': 'on' }
const COMBO_BROTLI_STATIC = { 'brotli_static': 'on' }
const COMBO_COMPRESS_STATIC = {
  ...COMBO_GZIP_STATIC,
  ...COMBO_BROTLI_STATIC
}

export {
  stringifyNginxConf,

  COMBO_MIME, DEFAULT_MIME, COMMON_MIME_MAP,
  COMMON_COMPRESS_MIME_LIST,
  COMBO_COMPRESS, COMBO_GZIP, COMBO_BROTLI,
  COMBO_GZIP_STATIC, COMBO_BROTLI_STATIC, COMBO_COMPRESS_STATIC
}
