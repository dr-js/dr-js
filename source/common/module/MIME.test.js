import { strictEqual } from 'source/common/verify.js'
import {
  DEFAULT_MIME,
  BASIC_EXTENSION_MAP,
  getMIMETypeFromFileName
} from './MIME.js'

const { describe, it } = globalThis

describe('source/common/module/MIME', () => {
  it('BASIC_EXTENSION_MAP[]', () => {
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
