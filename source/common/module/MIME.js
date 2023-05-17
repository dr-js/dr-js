// https://developer.mozilla.org/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
const DEFAULT_MIME = 'application/octet-stream'

// NOTE: 'application/javascript' is obsolete: https://stackoverflow.com/questions/876561/when-serving-javascript-files-is-it-better-to-use-the-application-javascript-or // TODO: HACK: according to SPEC '.cjs' should use 'application/node': https://github.com/nodejs/modules/issues/146
// NOTE: `video/webm` should overwrite above 'audio/webm' // TODO: HACK: allow inline playback for some '.mkv': https://superuser.com/questions/1281836/what-does-matroska-have-which-webm-doesnt-that-made-the-differentiation-necess
const BASIC_EXTENSION_MAP = `application|gzip;gz|json|pdf|wasm|xml|x-7z-compressed;7z|x-tar;tar|zip
audio|midi;mid|mpeg;mp3|ogg|wav|webm;weba|x-flac;flac
font|ttf|otf|woff|woff2
image|bmp|gif|jpeg;jpg|png|svg+xml;svg|vnd.microsoft.icon;ico|webp
text|css|csv|html;htm|javascript;js;mjs;cjs|plain;txt;text;conf;log;ini|rtf|xml
video|mp4;mp4v;mpg4|mpeg;mpg|webm;mkv|x-flv;flv|x-ms-wmv;wmv|x-msvideo;avi`
  .split('\n')
  .reduce((o, mimeData) => {
    const [ type, ...subDataList ] = mimeData.split('|')
    subDataList.forEach((subData) => {
      const extList = subData.split(';')
      extList.forEach((ext) => { o[ ext ] = `${type}/${extList[ 0 ]}` })
    })
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
