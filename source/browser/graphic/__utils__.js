const BUFFER_CANVAS = document.createElement('canvas')
const BUFFER_CANVAS_CONTEXT2D = BUFFER_CANVAS.getContext('2d')

const IMAGE_DATA_TYPE = {
  IMAGE_ELEMENT: 'IMAGE_ELEMENT', // fast, but not editable
  CANVAS_ELEMENT: 'CANVAS_ELEMENT', // fast, with vector graph edit API(recommend to use)
  CANVAS_IMAGE_DATA: 'CANVAS_IMAGE_DATA' // slow, but with pixel manipulation
}

// for CANVAS_ELEMENT / IMAGE_ELEMENT
const getElementDraw = (element) => (context, x, y) => context.drawImage(element, x, y)
const getElementDrawClip = (element, width, height) => (context, x, y, clipX, clipY, clipWidth, clipHeight) => {
  // context.drawImage(image, dx, dy)
  // context.drawImage(image, dx, dy, dWidth, dHeight)
  // context.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) // this function is capable of scale as well, but the scale is smoothed, not pixel-sharp
  clipWidth = Math.min(clipWidth, width - clipX)
  clipHeight = Math.min(clipHeight, height - clipY)
  context.drawImage(element, clipX, clipY, clipWidth, clipHeight, x, y, clipWidth, clipHeight)
}

// for CANVAS_IMAGE_DATA
const getCanvasImageDataDraw = (canvasImageData) => (context, x, y) => context.putImageData(canvasImageData, x, y)
const getCanvasImageDataDrawClip = (canvasImageData, width, height) => (context, x, y, clipX, clipY, clipWidth, clipHeight) => {
  // context.putImageData(imageData, dx, dy)
  // context.putImageData(imageData, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight)
  const dirtyWidth = Math.min(clipWidth, width - clipX)
  const dirtyHeight = Math.min(clipHeight, height - clipY)
  x = clipX ? x - clipX : x // adjust the dirty rect origin to (0, 0)
  y = clipY ? y - clipY : y
  context.putImageData(canvasImageData, x, y, clipX, clipY, dirtyWidth, dirtyHeight)
}

const createImageElement = (width, height) => {
  const imageElement = document.createElement('img')
  imageElement.width = width
  imageElement.height = height
  return imageElement
}

const createCanvasElement = (width, height) => {
  const canvasElement = document.createElement('canvas')
  canvasElement.width = width
  canvasElement.height = height
  return canvasElement
}

const createCanvasImageData = (width, height) => {
  BUFFER_CANVAS.width = width
  BUFFER_CANVAS.height = height
  return BUFFER_CANVAS_CONTEXT2D.getImageData(0, 0, width, height)
}

const applyImageElementExt = (imageElement) => {
  const { width, height } = imageElement
  return {
    width,
    height,
    imageElement,
    type: IMAGE_DATA_TYPE.IMAGE_ELEMENT,
    draw: getElementDraw(imageElement),
    drawClip: getElementDrawClip(imageElement, width, height)
  }
}

const applyCanvasElementExt = (canvasElement) => {
  const { width, height } = canvasElement
  return {
    width,
    height,
    canvasElement,
    type: IMAGE_DATA_TYPE.CANVAS_ELEMENT,
    draw: getElementDraw(canvasElement),
    drawClip: getElementDrawClip(canvasElement, width, height)
  }
}

const applyCanvasImageDataExt = (canvasImageData) => {
  const { width, height } = canvasImageData
  return {
    width,
    height,
    canvasImageData,
    type: IMAGE_DATA_TYPE.CANVAS_IMAGE_DATA,
    draw: getCanvasImageDataDraw(canvasImageData),
    drawClip: getCanvasImageDataDrawClip(canvasImageData, width, height)
  }
}

// transform type
const imageElementToCanvasElement = (imageElement) => {
  const canvasElement = document.createElement('canvas')
  canvasElement.width = imageElement.width
  canvasElement.height = imageElement.height
  canvasElement.getContext('2d').drawImage(imageElement, 0, 0)
  return canvasElement
}
const canvasImageDataToCanvasElement = (canvasImageData) => {
  const canvasElement = document.createElement('canvas')
  canvasElement.width = canvasImageData.width
  canvasElement.height = canvasImageData.height
  canvasElement.getContext('2d').putImageData(canvasImageData, 0, 0)
  return canvasElement
}
const canvasElementToCanvasImageData = (canvasElement) => canvasElement.getContext('2d').getImageData(0, 0, canvasElement.width, canvasElement.height)
const imageElementToCanvasImageData = (imageElement) => {
  BUFFER_CANVAS.width = imageElement.width
  BUFFER_CANVAS.height = imageElement.height
  BUFFER_CANVAS_CONTEXT2D.drawImage(imageElement, 0, 0)
  return BUFFER_CANVAS_CONTEXT2D.getImageData(0, 0, imageElement.width, imageElement.height)
}

// operation
const CANVAS_IMAGE_DATA_OPERATION = {
  scale: (imageData, scaleX, scaleY = scaleX) => {
    const sourceImageData = imageData
    const sourcePixelArray = sourceImageData.data
    const sourcePixelWidth = sourceImageData.width
    __DEV__ && console.log('[scale] sourceImageData size:', sourceImageData.width, sourceImageData.height)

    const targetImageData = BUFFER_CANVAS_CONTEXT2D.getImageData(0, 0, sourcePixelWidth * scaleX, sourceImageData.height * scaleY)
    const targetPixelArray = targetImageData.data
    const targetPixelWidth = targetImageData.width
    __DEV__ && console.log('[scale] targetImageData size:', targetImageData.width, targetImageData.height)

    const targetPixelCount = targetPixelWidth * targetImageData.height
    for (let targetPixelIndex = 0; targetPixelIndex < targetPixelCount; targetPixelIndex++) {
      const targetX = targetPixelIndex % targetPixelWidth
      const targetY = Math.floor(targetPixelIndex / targetPixelWidth)

      const sourceX = Math.floor(targetX / scaleX)
      const sourceY = Math.floor(targetY / scaleY)

      const targetPixelArrayIndex = targetPixelIndex * 4
      const sourcePixelArrayIndex = (sourceX + sourceY * sourcePixelWidth) * 4

      targetPixelArray[ targetPixelArrayIndex ] = sourcePixelArray[ sourcePixelArrayIndex ]
      targetPixelArray[ targetPixelArrayIndex + 1 ] = sourcePixelArray[ sourcePixelArrayIndex + 1 ]
      targetPixelArray[ targetPixelArrayIndex + 2 ] = sourcePixelArray[ sourcePixelArrayIndex + 2 ]
      targetPixelArray[ targetPixelArrayIndex + 3 ] = sourcePixelArray[ sourcePixelArrayIndex + 3 ]
    }

    return targetImageData
  },
  crop: (imageData, cropSelectFunc) => {
    const sourceWidth = imageData.width
    const sourceHeight = imageData.height
    const sourcePixelArray = imageData.data
    __DEV__ && console.log('[CANVAS_ELEMENT][crop] size before', sourceWidth, sourceHeight)

    let minX = sourceWidth - 1
    let minY = sourceHeight - 1
    let maxX = 0
    let maxY = 0

    const sourcePixelCount = sourceWidth * sourceHeight
    for (let index = 0; index < sourcePixelCount; index++) {
      const index4 = index * 4
      const isCrop = cropSelectFunc(sourcePixelArray[ index4 ], sourcePixelArray[ index4 + 1 ], sourcePixelArray[ index4 + 2 ], sourcePixelArray[ index4 + 3 ])
      if (isCrop) continue // drop this point
      // calc keep rect
      const x = index % sourceWidth
      const y = Math.floor(index / sourceWidth)
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }

    __DEV__ && console.log('[CANVAS_ELEMENT][crop] size result', minX, minY, maxX - minX, maxY - minY)
    if (maxX === 0 && maxY === 0) return imageData // nothing changed

    // resize
    const targetWidth = maxX - minX + 1
    const targetHeight = maxY - minY + 1
    __DEV__ && console.log('[CANVAS_ELEMENT][crop] size after', targetWidth, targetHeight)
    BUFFER_CANVAS.width = targetWidth
    BUFFER_CANVAS.height = targetHeight
    BUFFER_CANVAS_CONTEXT2D.putImageData(imageData, 0 - minX, 0 - minY, minX, minY, targetWidth, targetHeight)
    return BUFFER_CANVAS_CONTEXT2D.getImageData(0, 0, targetWidth, targetHeight)
  },
  getPixelColor: (imageData, x, y) => {
    const index = x + y * imageData.width
    const index4 = index * 4
    const data = imageData.data
    return {
      r: data[ index4 ],
      g: data[ index4 + 1 ],
      b: data[ index4 + 2 ],
      a: data[ index4 + 3 ]
    }
  },
  replaceColor: (imageData, replacerFunc) => {
    const data = imageData.data
    const dataLength4 = imageData.width * imageData.height * 4
    for (let index4 = 0; index4 < dataLength4; index4 += 4) {
      const replaceColor = replacerFunc(data[ index4 ], data[ index4 + 1 ], data[ index4 + 2 ], data[ index4 + 3 ])
      if (!replaceColor) continue
      data[ index4 ] = replaceColor.r
      data[ index4 + 1 ] = replaceColor.g
      data[ index4 + 2 ] = replaceColor.b
      data[ index4 + 3 ] = replaceColor.a
    }
  },
  drawPixel: (imageData, x, y, color) => {
    const index = x + y * imageData.width
    const index4 = index * 4
    const data = imageData.data
    data[ index4 ] = color.r
    data[ index4 + 1 ] = color.g
    data[ index4 + 2 ] = color.b
    data[ index4 + 3 ] = color.a
  },
  drawPixelLine: (imageData, point0, point1, color) => {
    let x0 = Math.round(point0.x)
    let y0 = Math.round(point0.y)
    // let z0 = point0.z
    const x1 = Math.round(point1.x)
    const y1 = Math.round(point1.y)
    // const z1 = point1.z
    const dx = Math.abs(x1 - x0)
    const dy = Math.abs(y1 - y0)
    // const dz = Math.abs(z1 - z0) / Math.sqrt(dx * dx + dy * dy)
    const sx = x0 < x1 ? 1 : -1
    const sy = y0 < y1 ? 1 : -1
    // const sz = (z0 < z1) ? dz : -dz
    let err = dx - dy
    while (true) {
      CANVAS_IMAGE_DATA_OPERATION.drawPixel(imageData, x0, y0, color)
      if (x0 === x1 && y0 === y1) break
      const e2 = 2 * err
      if (e2 > -dy) {
        err -= dy
        x0 += sx
      }
      if (e2 < dx) {
        err += dx
        y0 += sy
      }
      // z0 += sz
    }
  },
  drawPixelLineList: (imageData, pointList, color, isLoop) => {
    if (pointList.length <= 1) throw new Error('[drawPixelLineList] error pointList length:', pointList.length)
    let fromPoint = isLoop ? pointList[ pointList.length - 1 ] : pointList[ 0 ]
    let pointIndex = isLoop ? 0 : 1
    while (pointIndex < pointList.length) {
      CANVAS_IMAGE_DATA_OPERATION.drawPixelLine(imageData, fromPoint, pointList[ pointIndex ], color)
      fromPoint = pointList[ pointIndex ]
      pointIndex++
    }
  },
  floodFill: (imageData, startPoint, fillColor) => {
    startPoint.x = Math.round(startPoint.x)
    startPoint.y = Math.round(startPoint.y)

    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    const fromColor = CANVAS_IMAGE_DATA_OPERATION.getPixelColor(imageData, startPoint.x, startPoint.y)
    const toColor = fillColor

    const markPointArray = []

    const putColor = (x, y, color) => {
      const index = (y * width + x) * 4
      data[ index ] = color.r
      data[ index + 1 ] = color.g
      data[ index + 2 ] = color.b
      data[ index + 3 ] = color.a
    }

    const checkColor = (x, y, color) => {
      const index = (y * width + x) * 4
      return data[ index ] === color.r && data[ index + 1 ] === color.g && data[ index + 2 ] === color.b && data[ index + 3 ] === color.a
    }

    const comboPush = (xLeft, xRight, checkY) => {
      let checkX = xLeft + 1
      let isCombo = false
      while (checkX < xRight) {
        if (checkColor(checkX, checkY, fromColor)) {
          if (!isCombo) {
            isCombo = true
            markPointArray.push({ x: checkX, y: checkY })
          }
        } else isCombo = false
        checkX++
      }
    }

    // check initial point
    if (checkColor(startPoint.x, startPoint.y, toColor)) return

    markPointArray.push(startPoint)

    // stack loop
    while (markPointArray.length) { // loop marked points
      const { x, y } = markPointArray.pop()
      if (!checkColor(x, y, fromColor)) continue
      putColor(x, y, toColor) // paint current point
      let xLeft = x - 1
      while (xLeft >= 0 && checkColor(xLeft, y, fromColor)) { // left expand
        putColor(xLeft, y, toColor)
        xLeft--
      }
      let xRight = x + 1
      while (xRight < width && checkColor(xRight, y, fromColor)) { // right expand
        putColor(xRight, y, toColor)
        xRight++
      }
      if (y - 1 >= 0) comboPush(xLeft, xRight, y - 1) // up check
      if (y + 1 < height) comboPush(xLeft, xRight, y + 1) // down check
    }
  }
}

export {
  IMAGE_DATA_TYPE,

  createImageElement,
  createCanvasElement,
  createCanvasImageData,

  applyImageElementExt,
  applyCanvasElementExt,
  applyCanvasImageDataExt,

  imageElementToCanvasElement,
  canvasImageDataToCanvasElement,
  canvasElementToCanvasImageData,
  imageElementToCanvasImageData,

  CANVAS_IMAGE_DATA_OPERATION
}
