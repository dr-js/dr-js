import { createCanvasElement, canvasElementToCanvasImageData, canvasImageDataToCanvasElement } from 'source/browser/graphic/ImageData'
import { scale as scaleCanvasImageData } from 'source/browser/graphic/CanvasImageDataOperation'

// intended to be used for single character
const DEFAULT_GET_SYMBOL_METRICS = () => {
  const bufferCanvasContext2d = document.createElement('canvas').getContext('2d')
  return (symbol, fontConfig) => {
    bufferCanvasContext2d.font = fontConfig.attribute
    return bufferCanvasContext2d.measureText(symbol)
  }
}

const createFontGenerator = (getSymbolMetrics = DEFAULT_GET_SYMBOL_METRICS()) => {
  const symbolCanvasElementMap = {}
  const scaledSymbolCanvasElementMap = {}

  const getFontConfig = ({ fontSize = 12, lineHeight = 16, fontStyle = 'normal', fontFamily = 'monospace', fillStyle = '#000' }) => { // check CSS font for usage
    const attribute = `${fontStyle} ${fontSize}px/${lineHeight}px ${fontFamily}` // css text
    const cacheTag = `${fontStyle}|${fontSize}|${lineHeight}|${fontFamily}|${fillStyle}`
    return { fontSize, lineHeight, fontStyle, fontFamily, fillStyle, attribute, cacheTag }
  }

  const generateSymbol = (symbol, fontConfig, metricsWidth) => { // with generated cache, intended to be used for single character
    const generatedCanvasElement = createCanvasElement(metricsWidth, fontConfig.lineHeight)
    const context = generatedCanvasElement.getContext('2d')
    context.font = fontConfig.attribute
    context.textAlign = 'start'
    context.textBaseline = 'middle' // better than 'top'
    context.fillStyle = fontConfig.fillStyle
    context.fillText(symbol, 0, fontConfig.lineHeight * 0.5)
    if (symbolCanvasElementMap[ symbol ] === undefined) symbolCanvasElementMap[ symbol ] = {}
    symbolCanvasElementMap[ symbol ][ fontConfig.cacheTag ] = generatedCanvasElement
    return generatedCanvasElement
  }

  const renderSymbol = (symbol, fontConfig) => (symbolCanvasElementMap[ symbol ] && symbolCanvasElementMap[ symbol ][ fontConfig.cacheTag ]) ||
    generateSymbol(symbol, fontConfig, getSymbolMetrics(symbol, fontConfig).width)

  const renderSymbolScaled = (symbol, scaleRatio, fontConfig) => {
    const cacheKey = `${symbol}|${scaleRatio}:${fontConfig.cacheTag}` // TODO: not a good cache key
    let scaledSymbolCanvasElement = scaledSymbolCanvasElementMap[ cacheKey ]
    if (!scaledSymbolCanvasElement) {
      __DEV__ && console.log('cache add', cacheKey)
      const symbolCanvasElement = renderSymbol(symbol, fontConfig)
      const canvasImageData = canvasElementToCanvasImageData(symbolCanvasElement)
      const scaledCanvasImageData = scaleCanvasImageData(canvasImageData, scaleRatio, scaleRatio)
      scaledSymbolCanvasElement = canvasImageDataToCanvasElement(scaledCanvasImageData)
      scaledSymbolCanvasElementMap[ cacheKey ] = scaledSymbolCanvasElement
    }
    return scaledSymbolCanvasElement
  }

  return {
    getFontConfig,
    renderSymbol,
    renderSymbolScaled
  }
}

export { createFontGenerator }
