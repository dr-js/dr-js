const DEFAULT_ON_MISSING_REQUEST = (symbol) => null

const createFontMapper = (fontSize = 16, lineHeight = 20, onMissingRequest = DEFAULT_ON_MISSING_REQUEST) => {
  let configFontSize = fontSize
  let configLineHeight = lineHeight
  let symbolMetricsMap = {} // symbol -> { deltaX, offsetX, offsetY }
  let symbolDefault
  let symbolMetricsDefault

  // offset: to top-left
  const setDefaultSymbol = (symbol = '', deltaX = configFontSize, offsetX = 0, offsetY = 0) => {
    symbolDefault = symbol
    symbolMetricsDefault = { deltaX, offsetX, offsetY }
  }

  const setOnMissingRequest = (nextOnMissingRequest) => { onMissingRequest = nextOnMissingRequest }

  const autoIncreasePosition = (cursorPosition, deltaX) => { cursorPosition.x += deltaX } // limit height, width grow ('\n' will cause height increase)

  // map speedup
  let mapLimitWidth = 0
  let mapLineHeight = 0
  const autoIncreasePositionLimitWidth = (cursorPosition, deltaX) => {
    // limit width, height grow
    cursorPosition.x += deltaX
    if (cursorPosition.x > mapLimitWidth) { // line break
      cursorPosition.x = 0
      cursorPosition.y += mapLineHeight
    }
  }

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

    mapLimitWidth = limitWidth || 0
    mapLineHeight = configLineHeight * scaleRatio

    const cursorPosition = { x: 0, y: 0 } // top-left of symbol
    const autoIncreasePositionX = mapLimitWidth > 0 ? autoIncreasePositionLimitWidth : autoIncreasePosition
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

      if (callback !== undefined) callback(index, symbol, cursorPosition.x + symbolMetrics.offsetX, cursorPosition.y + symbolMetrics.offsetY) // send current position to callback

      switch (symbol) { // increase position
        case '\n':
        case '\r':
          cursorPosition.x = 0
          cursorPosition.y += mapLineHeight
          break
        case '\t':
          autoIncreasePositionX(cursorPosition, symbolMetricsDefault.deltaX * 4 * scaleRatio)
          break
        default:
          autoIncreasePositionX(cursorPosition, symbolMetrics.deltaX * scaleRatio)
          break
      }

      widthMax = Math.max(widthMax, cursorPosition.x)
    }

    return {
      size: { width: widthMax, height: cursorPosition.y + mapLineHeight },
      position: cursorPosition // stops position
    }
  }

  setDefaultSymbol(' ')

  return {
    setDefaultSymbol,
    setOnMissingRequest,
    setConfig,
    addSymbol,
    autoMapping
  }
}

export { createFontMapper }
