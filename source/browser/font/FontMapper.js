const DEFAULT_ON_MISSING_REQUEST = (symbol) => null

export class FontMapper {
  constructor (fontSize = 16, lineHeight = 20, onMissingRequest = DEFAULT_ON_MISSING_REQUEST) {
    this.configFontSize = fontSize
    this.configLineHeight = lineHeight
    this.onMissingRequest = onMissingRequest

    this.setDefaultSymbol(' ')

    this.symbolMetricsMap = {} // symbol -> { deltaX, offsetX, offsetY }

    // map speedup
    this.mapLimitWidth = 0
    this.mapLineHeight = 0

    this.autoIncreasePosition = (cursorPosition, deltaX) => {
      // limit height, width grow ('\n' will cause height increase)
      cursorPosition.x += deltaX
    }
    this.autoIncreasePositionLimitWidth = (cursorPosition, deltaX) => {
      // limit width, height grow
      cursorPosition.x += deltaX
      if (cursorPosition.x > this.mapLimitWidth) {
        // line break
        cursorPosition.x = 0
        cursorPosition.y += this.mapLineHeight
      }
    }
  }

  setConfig (fontSize, lineHeight) {
    this.configFontSize = fontSize
    this.configLineHeight = lineHeight
  }

  // offset: to top-left
  setDefaultSymbol (symbol = '', deltaX = this.configFontSize, offsetX = 0, offsetY = 0) {
    this.symbolDefault = symbol
    this.symbolMetricsDefault = { deltaX, offsetX, offsetY }
  }

  addSymbol (symbol, deltaX, offsetX = 0, offsetY = 0) {
    const symbolMetrics = { deltaX, offsetX, offsetY }
    this.symbolMetricsMap[ symbol ] = symbolMetrics
    return symbolMetrics
  }

  autoMapping (text, scaleRatio, limitWidth, callback) {
    scaleRatio = scaleRatio || 1

    this.mapLimitWidth = limitWidth || 0
    this.mapLineHeight = this.configLineHeight * scaleRatio

    const cursorPosition = { x: 0, y: 0 } // top-left of symbol
    const autoIncreasePosition = this.mapLimitWidth > 0 ? this.autoIncreasePositionLimitWidth : this.autoIncreasePosition
    let widthMax = 0

    for (let index = 0, length = text.length; index < length; index++) {
      let symbol = text.charAt(index)
      let symbolMetrics = this.symbolMetricsMap[ symbol ] || this.onMissingRequest(symbol)
      if (!symbolMetrics) {
        console.warn(`[FontMapper][autoMapping] missing metrics for symbol: ${symbol}`)
        // throw new Error(`[FontMapper][autoMapping] missing metrics for symbol: ${symbol}`)
        symbol = this.symbolDefault
        symbolMetrics = this.symbolMetricsDefault
      }

      if (callback !== undefined) callback(index, symbol, cursorPosition.x + symbolMetrics.offsetX, cursorPosition.y + symbolMetrics.offsetY) // send current position to callback

      switch (symbol) { // increase position
        case '\n':
        case '\r':
          cursorPosition.x = 0
          cursorPosition.y += this.mapLineHeight
          break
        case '\t':
          autoIncreasePosition(cursorPosition, this.symbolMetricsDefault.deltaX * 4 * scaleRatio)
          break
        default:
          autoIncreasePosition(cursorPosition, symbolMetrics.deltaX * scaleRatio)
          break
      }

      widthMax = Math.max(widthMax, cursorPosition.x)
    }

    return {
      size: { width: widthMax, height: cursorPosition.y + this.mapLineHeight },
      position: cursorPosition // stops position
    }
  }
}
