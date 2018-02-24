const DEFAULT_MIME = 'application/octet-stream'

const BASIC_MIME_MAP = {
  'application/javascript': [ 'js', 'mjs' ],
  'application/json': [ 'json' ],
  'application/json5': [ 'json5' ],
  'application/pdf': [ 'pdf' ],
  'application/x-rar-compressed': [ 'rar' ],
  'application/x-sh': [ 'sh' ],
  'application/x-tar': [ 'tar' ],
  'application/xml': [ 'xml' ],
  'application/zip': [ 'zip' ],
  'audio/midi': [ 'mid', 'midi' ],
  'audio/mpeg': [ 'mp3' ],
  'audio/ogg': [ 'ogg' ],
  'audio/wav': [ 'wav' ],
  'audio/webm': [ 'weba' ],
  'audio/x-flac': [ 'flac' ],
  'font/opentype': [ 'otf' ],
  'font/ttf': [ 'ttf' ],
  'font/woff': [ 'woff' ],
  'font/woff2': [ 'woff2' ],
  'image/bmp': [ 'bmp' ],
  'image/gif': [ 'gif' ],
  'image/jpeg': [ 'jpeg', 'jpg' ],
  'image/png': [ 'png' ],
  'image/svg+xml': [ 'svg' ],
  'image/webp': [ 'webp' ],
  'image/x-icon': [ 'ico' ],
  'text/cache-manifest': [ 'manifest' ],
  'text/css': [ 'css' ],
  'text/csv': [ 'csv' ],
  'text/html': [ 'html', 'htm' ],
  'text/plain': [ 'txt', 'text', 'conf', 'log', 'ini' ],
  'text/rtf': [ 'rtf' ],
  'text/xml': [ 'xml' ],
  'video/mp4': [ 'mp4', 'mp4v', 'mpg4' ],
  'video/mpeg': [ 'mpeg', 'mpg' ],
  'video/webm': [ 'webm' ],
  'video/x-f4v': [ 'f4v' ],
  'video/x-flv': [ 'flv' ],
  'video/x-m4v': [ 'm4v' ],
  'video/x-ms-wmv': [ 'wmv' ],
  'video/x-msvideo': [ 'avi' ],
  'video/x-matroska': [ 'mkv', 'mk3d', 'mks' ]
}

const BASIC_EXTENSION_MAP = Object.entries(BASIC_MIME_MAP).reduce((o, [ mime, extensionList ]) => {
  extensionList.forEach((extension) => (o[ extension ] = mime))
  return o
}, {})

const getMIMETypeFromFileName = (fileName) => {
  const result = REGEXP_EXTENSION.exec(fileName)
  return (result && BASIC_EXTENSION_MAP[ result[ 1 ] ]) || DEFAULT_MIME
}
const REGEXP_EXTENSION = /\.(\w+)$/

export {
  DEFAULT_MIME,
  BASIC_MIME_MAP,
  BASIC_EXTENSION_MAP,
  getMIMETypeFromFileName
}
