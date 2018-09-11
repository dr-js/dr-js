const BASIC_MIME_DATA_LIST = [
  'application/javascript;js;mjs',
  'application/json',
  'application/pdf',
  'application/xml',
  'audio/midi;mid',
  'audio/mpeg;mp3',
  'audio/ogg',
  'audio/wav',
  'audio/webm;weba',
  'audio/x-flac;flac',
  'font/ttf',
  'font/otf',
  'font/woff',
  'font/woff2',
  'image/bmp',
  'image/gif',
  'image/jpeg;jpg',
  'image/png',
  'image/svg+xml;svg',
  'image/webp',
  'image/x-icon;ico',
  'text/css',
  'text/csv',
  'text/html;htm',
  'text/plain;txt;text;conf;log;ini',
  'text/rtf',
  'text/xml',
  'video/mp4;mp4v;mpg4',
  'video/mpeg;mpg',
  'video/webm',
  'video/x-flv;flv',
  'video/x-ms-wmv;wmv',
  'video/x-msvideo;avi'
]

const DEFAULT_MIME = 'application/octet-stream'

const BASIC_EXTENSION_MAP = BASIC_MIME_DATA_LIST.reduce((o, mimeData) => {
  const [ mime ] = mimeData.split(';')
  mimeData.split('/')[ 1 ].split(';').forEach((extension) => (o[ extension ] = mime))
  return o
}, {})

const REGEXP_EXTENSION = /\.(\w+)$/
const getMIMETypeFromFileName = (fileName) => {
  const result = REGEXP_EXTENSION.exec(fileName)
  return (result && BASIC_EXTENSION_MAP[ result[ 1 ] ]) || DEFAULT_MIME
}

export {
  DEFAULT_MIME,
  BASIC_EXTENSION_MAP,
  getMIMETypeFromFileName
}
