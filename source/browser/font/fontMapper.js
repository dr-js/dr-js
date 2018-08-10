const DEFAULT_ON_MISSING_REQUEST = (symbol) => null

const createFontMapper = (fontSize = 16, lineHeight = 20, onMissingRequest = DEFAULT_ON_MISSING_REQUEST) => {
  let configFontSize = fontSize
  let configLineHeight = lineHeight
  let symbolMetricsMap = {} // symbol -> { deltaX, offsetX, offsetY }
  let symbolDefault
  let symbolMetricsDefault

  // offset: to top-left
  const setDefaultSymbol = (symbol = '?', deltaX = configFontSize, offsetX = 0, offsetY = 0) => {
    symbolDefault = symbol
    symbolMetricsDefault = { deltaX, offsetX, offsetY }
  }

  const setOnMissingRequest = (nextOnMissingRequest) => { onMissingRequest = nextOnMissingRequest }

  const setConfig = (fontSize, lineHeight) => {
    configFontSize = fontSize
    configLineHeight = lineHeight
  }

  const addSymbol = (symbol, deltaX, offsetX = 0, offsetY = 0) => {
    const symbolMetrics = { deltaX, offsetX, offsetY }
    symbolMetricsMap[ symbol ] = symbolMetrics
    return symbolMetrics
  }

  const autoMapping = (text, scaleRatio, limitWidth, callback) => {
    scaleRatio = scaleRatio || 1

    const mapLimitWidth = limitWidth || 0
    const mapLineHeight = configLineHeight * scaleRatio

    const cursorPosition = { x: 0, y: 0 } // top-left of symbol
    let widthMax = 0

    for (let index = 0, length = text.length; index < length; index++) {
      let symbol = text.charAt(index)
      let symbolMetrics = symbolMetricsMap[ symbol ] || onMissingRequest(symbol)
      if (!symbolMetrics) {
        console.warn(`[FontMapper][autoMapping] missing metrics for symbol: ${symbol}`)
        // throw new Error(`[FontMapper][autoMapping] missing metrics for symbol: ${symbol}`)
        symbol = symbolDefault
        symbolMetrics = symbolMetricsDefault
      }

      switch (symbol) { // increase position
        case '\n':
        case '\r':
          cursorPosition.x = 0
          cursorPosition.y += mapLineHeight
          break
        case '\t':
          cursorPosition.x += symbolMetricsDefault.deltaX * scaleRatio * 4
          break
        default:
          if (mapLimitWidth !== 0 && (cursorPosition.x + symbolMetrics.deltaX * scaleRatio > mapLimitWidth)) {
            cursorPosition.x = 0
            cursorPosition.y += mapLineHeight
          }
          callback && callback(
            index,
            symbol,
            cursorPosition.x + symbolMetrics.offsetX * scaleRatio,
            cursorPosition.y + symbolMetrics.offsetY * scaleRatio
          ) // send current position to callback
          cursorPosition.x += symbolMetrics.deltaX * scaleRatio
          break
      }

      widthMax = Math.max(widthMax, cursorPosition.x)
    }

    return {
      size: { width: widthMax, height: cursorPosition.y + mapLineHeight },
      position: cursorPosition // stops position
    }
  }

  setDefaultSymbol('?')

  return {
    setDefaultSymbol,
    setOnMissingRequest,
    setConfig,
    addSymbol,
    autoMapping
  }
}

export { createFontMapper }
