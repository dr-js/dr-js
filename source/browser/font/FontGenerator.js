import { createCanvasElement, canvasElementToCanvasImageData, canvasImageDataToCanvasElement, CANVAS_IMAGE_DATA_OPERATION } from 'source/browser/graphic'

const BUFFER_CANVAS = document.createElement('canvas')
const BUFFER_CANVAS_CONTEXT2D = BUFFER_CANVAS.getContext('2d')

// intended to be used for single character
const DEFAULT_GET_SYMBOL_METRICS = (symbol, fontConfig) => {
  BUFFER_CANVAS_CONTEXT2D.font = fontConfig.attribute
  return BUFFER_CANVAS_CONTEXT2D.measureText(symbol)
}

export class FontGenerator {
  constructor (getSymbolMetrics = DEFAULT_GET_SYMBOL_METRICS) {
    this.getSymbolMetrics = getSymbolMetrics
    this.symbolCanvasElementMap = {}
    this.scaledSymbolCanvasElementMap = {}
    this.setDefaultAttribute()
  }

  setDefaultAttribute (fontSize = 12, lineHeight = 16, fontStyle = 'normal', fontFamily = 'monospace', fillStyle = '#000') {
    this.defaultFontSize = fontSize
    this.defaultLineHeight = lineHeight
    this.defaultFontStyle = fontStyle // normal, italic, oblique
    this.defaultFontFamily = fontFamily
    this.defaultFillStyle = fillStyle // color
    this.defaultFontConfig = this.getFontConfig()
  }

  getFontConfig (fontSize, lineHeight, fontStyle, fontFamily, fillStyle) {
    // check CSS font for usage
    fontSize = fontSize || this.defaultFontSize
    lineHeight = lineHeight || this.defaultLineHeight
    fontStyle = fontStyle || this.defaultFontStyle
    fontFamily = fontFamily || this.defaultFontFamily
    fillStyle = fillStyle || this.defaultFillStyle
    return {
      fontSize,
      lineHeight,
      fontStyle,
      fontFamily,
      fillStyle,
      attribute: `${fontStyle} ${fontSize}px/${lineHeight}px ${fontFamily}`, // css text
      cacheTag: `${fontStyle}|${fontSize}|${lineHeight}|${fontFamily}|${fillStyle}`
    }
  }

  // with generated cache, intended to be used for single character
  generateSymbol (symbol, fontConfig, metricsWidth) {
    const generatedCanvasElement = createCanvasElement(metricsWidth, fontConfig.lineHeight)
    const context = generatedCanvasElement.getContext('2d')
    context.font = fontConfig.attribute
    context.textAlign = 'start'
    context.textBaseline = 'middle' // better than 'top'
    context.fillStyle = fontConfig.fillStyle
    context.fillText(symbol, 0, fontConfig.lineHeight * 0.5)
    if (this.symbolCanvasElementMap[ symbol ] === undefined) this.symbolCanvasElementMap[ symbol ] = {}
    this.symbolCanvasElementMap[ symbol ][ fontConfig.cacheTag ] = generatedCanvasElement
    return generatedCanvasElement
  }

  renderSymbol (symbol, fontConfig) {
    return (this.symbolCanvasElementMap[ symbol ] && this.symbolCanvasElementMap[ symbol ][ fontConfig.cacheTag ]) ||
      this.generateSymbol(symbol, fontConfig, this.getSymbolMetrics(symbol, fontConfig).width)
  }

  renderSymbolScaled (symbol, scaleRatio, fontConfig = this.defaultFontConfig) {
    const cacheKey = `${symbol}|${scaleRatio}:${fontConfig.cacheTag}`
    let scaledSymbolCanvasElement = this.scaledSymbolCanvasElementMap[ cacheKey ]
    if (!scaledSymbolCanvasElement) {
      __DEV__ && console.log('cache add', cacheKey)
      const symbolCanvasElement = this.renderSymbol(symbol, fontConfig)
      const canvasImageData = canvasElementToCanvasImageData(symbolCanvasElement)
      const scaledCanvasImageData = CANVAS_IMAGE_DATA_OPERATION.scale(canvasImageData, scaleRatio, scaleRatio)
      scaledSymbolCanvasElement = canvasImageDataToCanvasElement(scaledCanvasImageData)
      this.scaledSymbolCanvasElementMap[ cacheKey ] = scaledSymbolCanvasElement
    }
    return scaledSymbolCanvasElement
  }
}
