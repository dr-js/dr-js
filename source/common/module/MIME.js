const DEFAULT_MIME = 'application/octet-stream'
const BASIC_MIME_MAP = {
  'application/font-woff': [ 'woff' ],
  'application/font-woff2': [ 'woff2' ],
  'application/javascript': [ 'js' ],
  'application/json': [ 'json' ],
  'application/json5': [ 'json5' ],
  'application/pdf': [ 'pdf' ],
  'application/x-font-ttf': [ 'ttf', 'ttc' ],
  'application/x-rar-compressed': [ 'rar' ],
  'application/x-sh': [ 'sh' ],
  'application/x-tar': [ 'tar' ],
  'application/xml': [ 'xml' ],
  'application/zip': [ 'zip' ],
  'audio/midi': [ 'mid', 'midi' ],
  'audio/mp3': [ 'mp3' ],
  'audio/mp4': [ 'm4a', 'mp4a' ],
  'audio/mpeg': [ 'mpga', 'mp2', 'mp2a', 'mp3', 'm2a', 'm3a' ],
  'audio/ogg': [ 'oga', 'ogg', 'spx' ],
  'audio/wav': [ 'wav' ],
  'audio/webm': [ 'weba' ],
  'audio/x-flac': [ 'flac' ],
  'font/opentype': [ 'otf' ],
  'image/bmp': [ 'bmp' ],
  'image/gif': [ 'gif' ],
  'image/jpeg': [ 'jpeg', 'jpg' ],
  'image/png': [ 'png' ],
  'image/svg+xml': [ 'svg' ],
  'image/webp': [ 'webp' ],
  'image/x-icon': [ 'ico' ],
  'text/cache-manifest': [ 'appcache', 'manifest' ],
  'text/css': [ 'css' ],
  'text/csv': [ 'csv' ],
  'text/html': [ 'html', 'htm', 'shtml' ],
  'text/plain': [ 'txt', 'text', 'conf', 'log', 'ini' ],
  'text/rtf': [ 'rtf' ],
  'text/xml': [ 'xml' ],
  'video/mp4': [ 'mp4', 'mp4v', 'mpg4' ],
  'video/mpeg': [ 'mpeg', 'mpg', 'mpe', 'm1v', 'm2v' ],
  'video/webm': [ 'webm' ],
  'video/x-f4v': [ 'f4v' ],
  'video/x-flv': [ 'flv' ],
  'video/x-m4v': [ 'm4v' ],
  'video/x-matroska': [ 'mkv', 'mk3d', 'mks' ],
  'video/x-ms-wmv': [ 'wmv' ],
  'video/x-msvideo': [ 'avi' ]
}
const BASIC_EXTENSION_MAP = Object.keys(BASIC_MIME_MAP).reduce((o, mimeType) => {
  BASIC_MIME_MAP[ mimeType ].forEach((extensionType) => (o[ extensionType ] = mimeType))
  return o
}, {})

export {
  DEFAULT_MIME,
  BASIC_MIME_MAP,
  BASIC_EXTENSION_MAP
}