import { strictEqual } from 'source/common/verify.js'

import {
  getQuickCanvas,
  getQuickContext2d
} from './ImageData.js'

const { describe, it } = globalThis

describe('Graphic.ImageData', () => {
  it('getQuickCanvas()', async () => {
    strictEqual(
      getQuickCanvas() instanceof window.HTMLCanvasElement,
      true
    )
  })

  it('getQuickContext2d()', async () => {
    strictEqual(
      getQuickContext2d() instanceof window.CanvasRenderingContext2D,
      true
    )
  })
})
