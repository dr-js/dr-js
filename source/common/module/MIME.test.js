import { strictEqual, stringifyEqual } from 'source/common/verify.js'
import {
  DEFAULT_MIME,
  BASIC_EXTENSION_MAP,
  getMIMETypeFromFileName
} from './MIME.js'

const { describe, it } = globalThis

describe('source/common/module/MIME', () => {
  it('BASIC_EXTENSION_MAP[]', () => {
    stringifyEqual(BASIC_EXTENSION_MAP, {
      'gzip': 'application/gzip',
      'gz': 'application/gzip',
      'json': 'application/json',
      'pdf': 'application/pdf',
      'wasm': 'application/wasm',
      'xml': 'text/xml',
      'x-7z-compressed': 'application/x-7z-compressed',
      '7z': 'application/x-7z-compressed',
      'x-tar': 'application/x-tar',
      'tar': 'application/x-tar',
      'zip': 'application/zip',
      'midi': 'audio/midi',
      'mid': 'audio/midi',
      'mpeg': 'video/mpeg',
      'mp3': 'audio/mpeg',
      'ogg': 'audio/ogg',
      'wav': 'audio/wav',
      'webm': 'video/webm',
      'weba': 'audio/webm',
      'x-flac': 'audio/x-flac',
      'flac': 'audio/x-flac',
      'ttf': 'font/ttf',
      'otf': 'font/otf',
      'woff': 'font/woff',
      'woff2': 'font/woff2',
      'bmp': 'image/bmp',
      'gif': 'image/gif',
      'jpeg': 'image/jpeg',
      'jpg': 'image/jpeg',
      'png': 'image/png',
      'svg+xml': 'image/svg+xml',
      'svg': 'image/svg+xml',
      'vnd.microsoft.icon': 'image/vnd.microsoft.icon',
      'ico': 'image/vnd.microsoft.icon',
      'webp': 'image/webp',
      'css': 'text/css',
      'csv': 'text/csv',
      'html': 'text/html',
      'htm': 'text/html',
      'javascript': 'text/javascript',
      'js': 'text/javascript',
      'mjs': 'text/javascript',
      'cjs': 'text/javascript',
      'plain': 'text/plain',
      'txt': 'text/plain',
      'text': 'text/plain',
      'conf': 'text/plain',
      'log': 'text/plain',
      'ini': 'text/plain',
      'rtf': 'text/rtf',
      'mp4': 'video/mp4',
      'mp4v': 'video/mp4',
      'mpg4': 'video/mp4',
      'mpg': 'video/mpeg',
      'mkv': 'video/webm',
      'x-flv': 'video/x-flv',
      'flv': 'video/x-flv',
      'x-ms-wmv': 'video/x-ms-wmv',
      'wmv': 'video/x-ms-wmv',
      'x-msvideo': 'video/x-msvideo',
      'avi': 'video/x-msvideo'
    })
    strictEqual(BASIC_EXTENSION_MAP[ 'non-exist-ext' ], undefined)
    strictEqual(BASIC_EXTENSION_MAP[ 'js' ], 'text/javascript')
    strictEqual(BASIC_EXTENSION_MAP[ 'cjs' ], 'text/javascript')
    strictEqual(BASIC_EXTENSION_MAP[ 'webm' ], 'video/webm', '"video/webm" should overwrite "audio/webm" for ".webm"')
  })

  it('getMIMETypeFromFileName()', () => {
    strictEqual(getMIMETypeFromFileName('file.non-exist-ext'), DEFAULT_MIME)
    strictEqual(getMIMETypeFromFileName('file-without-ext..'), DEFAULT_MIME)
    strictEqual(getMIMETypeFromFileName('file-without-ext'), DEFAULT_MIME)
    strictEqual(getMIMETypeFromFileName('file.png.mjs.webm'), 'video/webm')
  })
})
