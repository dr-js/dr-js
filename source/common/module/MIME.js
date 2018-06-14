const BASIC_MIME_DATA_LIST = [
  'application/javascript:js;mjs',
  'application/json:json',
  'application/pdf:pdf',
  'application/xml:xml',
  'audio/midi:mid;midi',
  'audio/mpeg:mp3',
  'audio/ogg:ogg',
  'audio/wav:wav',
  'audio/webm:weba',
  'audio/x-flac:flac',
  'font/ttf:ttf',
  'font/woff:woff',
  'font/woff2:woff2',
  'image/bmp:bmp',
  'image/gif:gif',
  'image/jpeg:jpeg;jpg',
  'image/png:png',
  'image/svg+xml:svg',
  'image/webp:webp',
  'image/x-icon:ico',
  'text/css:css',
  'text/csv:csv',
  'text/html:html;htm',
  'text/plain:txt;text;conf;log;ini',
  'text/rtf:rtf',
  'text/xml:xml',
  'video/mp4:mp4;mp4v;mpg4',
  'video/mpeg:mpeg;mpg',
  'video/webm:webm',
  'video/x-flv:flv',
  'video/x-ms-wmv:wmv',
  'video/x-msvideo:avi'
]

const DEFAULT_MIME = 'application/octet-stream'

const BASIC_EXTENSION_MAP = BASIC_MIME_DATA_LIST.reduce((o, mimeData) => {
  const [ mime, extensionData ] = mimeData.split(':')
  extensionData.split(';').forEach((extension) => (o[ extension ] = mime))
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
