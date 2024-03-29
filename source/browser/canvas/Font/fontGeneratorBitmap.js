import { loadText, loadImage } from 'source/browser/canvas/function.js'
import { createCanvasElement, applyImageElementExt, canvasElementToCanvasImageData, canvasImageDataToCanvasElement } from 'source/browser/canvas/ImageData.js'
import { scale as scaleCanvasImageData } from 'source/browser/canvas/ImageDataOperation.js'

// const SAMPLE_DATA = {
//   fontImageSrc: 'data:image/png;base64,===', // or "BitmapFont.png",
//   symbolDataList: [
//     [ ' ', 0, 0, 6, 13, 0, 0, 0 ],
//     [ '~', 564, 0, 6, 13, 0, 0, 0 ]
//   ],
//   defaultSymbol: ' '
// }

const createFontGeneratorBitmap = () => {
  let defaultSymbol = null
  let symbolCanvasElementMap = {}
  let scaledSymbolCanvasElementMap = {}

  const loadBitmapFontData = async (bitmapFontDataSrc) => {
    const { symbolDataList, defaultSymbol: bitmapDefaultSymbol, fontImageSrc } = JSON.parse(await loadText(bitmapFontDataSrc))
    const bitMapImageElementExt = applyImageElementExt(await loadImage(fontImageSrc))

    const bitmapSymbolMetricsMap = {}
    const bitmapSymbolCanvasElementMap = {}

    for (let index = 0, indexMax = symbolDataList.length; index < indexMax; index++) {
      const [ symbol, rectX, rectY, rectWidth, rectHeight, xInc, xOffset, yOffset ] = symbolDataList[ index ]
      const symbolCanvasElement = createCanvasElement(rectWidth, rectHeight)
      bitMapImageElementExt.drawClip(symbolCanvasElement.getContext('2d'), 0, 0, rectX, rectY, rectWidth, rectHeight)
      bitmapSymbolMetricsMap[ symbol ] = { xInc, xOffset, yOffset }
      bitmapSymbolCanvasElementMap[ symbol ] = symbolCanvasElement
    }
    defaultSymbol = bitmapDefaultSymbol || '?'
    symbolCanvasElementMap = bitmapSymbolCanvasElementMap
    scaledSymbolCanvasElementMap = {}
  }

  const renderSymbol = (symbol) => symbolCanvasElementMap[ symbol ] || symbolCanvasElementMap[ defaultSymbol ]

  const renderSymbolScaled = (symbol, scaleRatio) => {
    const cacheKey = `${symbol}|${scaleRatio}`
    let scaledSymbolCanvasElement = scaledSymbolCanvasElementMap[ cacheKey ]
    if (!scaledSymbolCanvasElement) {
      __DEV__ && console.log('cache add', cacheKey)
      const symbolCanvasElement = renderSymbol(symbol)
      const canvasImageData = canvasElementToCanvasImageData(symbolCanvasElement)
      const scaledCanvasImageData = scaleCanvasImageData(canvasImageData, scaleRatio, scaleRatio)
      scaledSymbolCanvasElement = canvasImageDataToCanvasElement(scaledCanvasImageData)
      scaledSymbolCanvasElementMap[ cacheKey ] = scaledSymbolCanvasElement
    }
    return scaledSymbolCanvasElement
  }

  return {
    getDefaultSymbol: () => defaultSymbol,
    loadBitmapFontData,
    renderSymbol,
    renderSymbolScaled
  }
}

export { createFontGeneratorBitmap }
