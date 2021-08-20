import { truthy } from 'source/common/verify.js'

import {
  getQuickCanvas,
  getQuickContext2d
} from './ImageData.js'

const { describe, it } = globalThis

describe('Graphic.ImageData', () => {
  it('getQuickCanvas()', () => {
    truthy(getQuickCanvas() instanceof window.HTMLCanvasElement)
  })

  it('getQuickContext2d()', () => {
    truthy(getQuickContext2d() instanceof window.CanvasRenderingContext2D)
  })
})
