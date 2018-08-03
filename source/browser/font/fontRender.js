import { createCanvasElement } from 'source/browser/graphic/ImageData'
import { createFontMapper } from './fontMapper'
import { createFontGenerator } from './fontGenerator'

const createFontRender = (fontMapper = createFontMapper(), fontGenerator = createFontGenerator()) => {
  let fontConfig

  fontMapper.setOnMissingRequest((symbol) => { // link request to create
    const symbolImageData = fontGenerator.renderSymbol(symbol, fontConfig)
    return fontMapper.addSymbol(symbol, symbolImageData.width, 0, 0)
  })

  const applyFontConfig = (nextFontConfig = {}) => {
    fontConfig = fontGenerator.getFontConfig(nextFontConfig)
    const { fontSize, lineHeight } = fontConfig
    const defaultSymbol = ' '
    const defaultSymbolImageData = fontGenerator.renderSymbol(defaultSymbol, fontConfig)
    fontMapper.setConfig(fontSize, lineHeight)
    fontMapper.setDefaultSymbol(defaultSymbol, defaultSymbolImageData.width, 0, 0)
  }

  const renderText = (text, scaleRatio, limitWidth, textCanvasElement = createCanvasElement(0, 0)) => {
    let textAreaMetrics = fontMapper.autoMapping(text, scaleRatio, limitWidth, undefined)

    textCanvasElement.width = textAreaMetrics.size.width
    textCanvasElement.height = textAreaMetrics.size.height

    const textCanvasElementContext2d = textCanvasElement.getContext('2d')
    textAreaMetrics = fontMapper.autoMapping(text, scaleRatio, limitWidth, (index, symbol, x, y) => {
      const scaledSymbolCanvasElement = fontGenerator.renderSymbolScaled(symbol, scaleRatio, fontConfig)
      textCanvasElementContext2d.drawImage(scaledSymbolCanvasElement, x, y)
    })

    return {
      textCanvasElement,
      textAreaMetrics,
      textEndPosition: textAreaMetrics.position
    }
  }

  applyFontConfig()

  return {
    applyFontConfig,
    renderText
  }
}

export { createFontRender }
