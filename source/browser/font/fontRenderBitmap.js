import { createCanvasElement } from 'source/browser/graphic/ImageData'
import { createFontMapper } from './fontMapper'
import { createFontGeneratorBitmap } from './fontGeneratorBitmap'

const createFontRenderBitmap = (fontMapper = createFontMapper(), fontGenerator = createFontGeneratorBitmap()) => {
  fontMapper.setOnMissingRequest((symbol) => { // link request to create
    const symbolImageData = fontGenerator.renderSymbol(symbol)
    return fontMapper.addSymbol(symbol, symbolImageData.width, 0, 0)
  })

  const loadBitmapFontData = async (bitmapFontDataSrc, fontSize, lineHeight) => {
    fontMapper.setConfig(fontSize, lineHeight)
    await fontGenerator.loadBitmapFontData(bitmapFontDataSrc)
    fontMapper.setDefaultSymbol(fontGenerator.getDefaultSymbol(), fontGenerator.renderSymbol().width, 0, 0)
  }

  const renderText = (text, scaleRatio, limitWidth, textCanvasElement = createCanvasElement(0, 0)) => {
    let textAreaMetrics = fontMapper.autoMapping(text, scaleRatio, limitWidth, undefined)
    textCanvasElement.width = textAreaMetrics.size.width
    textCanvasElement.height = textAreaMetrics.size.height

    // textCanvasElement.floodFill({x:0, y:0}, {r:255, g:0, b:255, a:255})
    // textCanvasElement.toCanvas()

    const textCanvasElementContext2d = textCanvasElement.getContext('2d')
    textAreaMetrics = fontMapper.autoMapping(text, scaleRatio, limitWidth, (index, symbol, x, y) => {
      const scaledSymbolCanvasElement = fontGenerator.renderSymbolScaled(symbol, scaleRatio)
      textCanvasElementContext2d.drawImage(scaledSymbolCanvasElement, x, y)
    })

    return {
      textCanvasElement,
      textAreaMetrics,
      textEndPosition: textAreaMetrics.position
    }
  }

  return {
    loadBitmapFontData,
    renderText
  }
}

export { createFontRenderBitmap }
