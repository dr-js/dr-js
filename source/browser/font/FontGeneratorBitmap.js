/**
 * Generate font of same style, with different scale
 **/

import { createCanvasElement, applyImageElementExt, canvasElementToCanvasImageData, canvasImageDataToCanvasElement, CANVAS_IMAGE_DATA_OPERATION } from 'source/browser/graphic'
import { loadText, loadImage } from 'source/browser/resource'

export class FontGeneratorBitmap {
  constructor () {
    this.defaultSymbol = null
    this.symbolMetricsMap = {}
    this.symbolCanvasElementMap = {}
    this.scaledSymbolCanvasElementMap = {}
  }

  loadBitmapFontData (bitmapFontDataSrc) {
    let bitmapFontData
    let bitMapImageElement
    return loadText(bitmapFontDataSrc)
      .then((resultText) => {
        bitmapFontData = JSON.parse(resultText)
        return loadImage(bitmapFontData.fontImageSrc)
      })
      .then((imageElement) => (bitMapImageElement = imageElement))
      .then(() => {
        const { symbolDataList, defaultSymbol } = bitmapFontData
        const bitMapImageElementExt = applyImageElementExt(bitMapImageElement)
        for (let index = 0, indexMax = symbolDataList.length; index < indexMax; index++) {
          const { symbol, rectX, rectY, rectWidth, rectHeight, xInc, xOffset, yOffset } = parseSymbolData(symbolDataList[ index ])
          const symbolCanvasElement = createCanvasElement(rectWidth, rectHeight)
          bitMapImageElementExt.drawClip(symbolCanvasElement.getContext('2d'), 0, 0, rectX, rectY, rectWidth, rectHeight)
          this.symbolCanvasElementMap[ symbol ] = symbolCanvasElement
          this.symbolMetricsMap[ symbol ] = { xInc, xOffset, yOffset }
        }
        this.defaultSymbol = defaultSymbol || ' '
      })
  }

  renderSymbol (symbol) {
    return this.symbolCanvasElementMap[ symbol ] || this.symbolCanvasElementMap[ this.defaultSymbol ]
  }

  renderSymbolScaled (symbol, scaleRatio) {
    const cacheKey = `${symbol}|${scaleRatio}`
    let scaledSymbolCanvasElement = this.scaledSymbolCanvasElementMap[ cacheKey ]
    if (!scaledSymbolCanvasElement) {
      __DEV__ && console.log('cache add', cacheKey)
      const symbolCanvasElement = this.renderSymbol(symbol)
      const canvasImageData = canvasElementToCanvasImageData(symbolCanvasElement)
      const scaledCanvasImageData = CANVAS_IMAGE_DATA_OPERATION.scale(canvasImageData, scaleRatio, scaleRatio)
      scaledSymbolCanvasElement = canvasImageDataToCanvasElement(scaledCanvasImageData)
      this.scaledSymbolCanvasElementMap[ cacheKey ] = scaledSymbolCanvasElement
    }
    return scaledSymbolCanvasElement
  }
}

// const SAMPLE_DATA = {
//   fontImageSrc: 'data:image/png;base64,===', // or "BitmapFont.png",
//   symbolDataList: [
//     [ ' ', 0, 0, 6, 13, 0, 0, 0 ],
//     [ '~', 564, 0, 6, 13, 0, 0, 0 ]
//   ],
//   defaultSymbol: ' '
// }

const parseSymbolData = (data) => ({
  symbol: data[ 0 ],
  rectX: data[ 1 ],
  rectY: data[ 2 ],
  rectWidth: data[ 3 ],
  rectHeight: data[ 4 ],
  xInc: data[ 5 ],
  xOffset: data[ 6 ],
  yOffset: data[ 7 ]
})
