import { createCanvasElement } from 'source/browser/graphic'
import { FontMapper } from './FontMapper'
import { FontGenerator } from './FontGenerator'

export class FontRender {
  constructor () {
    this.fontGenerator = new FontGenerator()
    this.fontconfig = this.fontGenerator.getFontConfig()

    this.fontMapper = new FontMapper()
    this.fontMapper.onMissingRequest = (symbol) => { // link request to create
      const symbolImageData = this.fontGenerator.renderSymbol(symbol, this.fontconfig)
      return this.fontMapper.addSymbol(symbol, symbolImageData.width, 0, 0)
    }

    this.applyFontConfig(this.fontconfig)
  }

  applyFontConfig (fontConfig) {
    const { fontSize, lineHeight } = fontConfig

    const defaultSymbol = ' '
    const defaultSymbolImageData = this.fontGenerator.renderSymbol(defaultSymbol, fontConfig)

    this.fontMapper.setConfig(fontSize, lineHeight)
    this.fontMapper.setDefaultSymbol(defaultSymbol, defaultSymbolImageData.width, 0, 0)
  }

  renderText (text, scaleRatio, limitWidth, textCanvasElement = createCanvasElement(0, 0)) {
    let textAreaMetrics = this.fontMapper.autoMapping(text, scaleRatio, limitWidth, undefined)

    textCanvasElement.width = textAreaMetrics.size.width
    textCanvasElement.height = textAreaMetrics.size.height

    // textCanvasElement.floodFill({x:0, y:0}, {r:255, g:0, b:255, a:255})
    // textCanvasElement.toCanvas()

    const textCanvasElementContext2d = textCanvasElement.getContext('2d')
    textAreaMetrics = this.fontMapper.autoMapping(text, scaleRatio, limitWidth, (index, symbol, x, y) => {
      const scaledSymbolCanvasElement = this.fontGenerator.renderSymbolScaled(symbol, scaleRatio, this.fontconfig)
      textCanvasElementContext2d.drawImage(scaledSymbolCanvasElement, x, y)
    })

    return {
      textCanvasElement,
      textAreaMetrics,
      textEndPosition: textAreaMetrics.position
    }
  }
}
