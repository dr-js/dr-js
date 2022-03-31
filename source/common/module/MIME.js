const BASIC_MIME_DATA_LIST = [ // https://developer.mozilla.org/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
  'application/gzip;gz',
  'application/json',
  'application/pdf',
  'application/xml',
  'application/x-7z-compressed;7z',
  'application/x-tar;tar',
  'application/zip',

  // 'application/msword;doc',
  // 'application/vnd.ms-excel;xls',
  // 'application/vnd.ms-powerpoint;ppt',
  // 'application/vnd.openxmlformats-officedocument.wordprocessingml.document;docx',
  // 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;xlsx',
  // 'application/vnd.openxmlformats-officedocument.presentationml.presentation;pptx',

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
  'image/vnd.microsoft.icon;ico',
  'image/webp',

  'text/css',
  'text/csv',
  'text/html;htm',
  'text/javascript;js;mjs;cjs', // 'application/javascript' is obsolete: https://stackoverflow.com/questions/876561/when-serving-javascript-files-is-it-better-to-use-the-application-javascript-or // TODO: HACK: according to SPEC '.cjs' should use 'application/node': https://github.com/nodejs/modules/issues/146
  'text/plain;txt;text;conf;log;ini',
  'text/rtf',
  'text/xml',

  'video/mp4;mp4v;mpg4',
  'video/mpeg;mpg',
  'video/webm;mkv', // NOTE: should overwrite `webm` from above 'audio/webm' // TODO: HACK: allow inline playback for some '.mkv': https://superuser.com/questions/1281836/what-does-matroska-have-which-webm-doesnt-that-made-the-differentiation-necess
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
  const [ , fileExt ] = REGEXP_EXTENSION.exec(fileName) || []
  return (fileExt && BASIC_EXTENSION_MAP[ fileExt.toLowerCase() ]) || DEFAULT_MIME
}

export {
  DEFAULT_MIME,
  BASIC_EXTENSION_MAP,
  getMIMETypeFromFileName
}
