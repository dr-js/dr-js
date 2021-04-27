import { getQuickContext2d } from './ImageData.js'

const getPixelColor = (imageData, x, y) => (new Uint32Array(imageData.data.buffer))[ x + y * imageData.width ]
const replacePixelColor = (imageData, replacerFunc) => {
  const data = new Uint32Array(imageData.data.buffer)
  for (let index = 0, indexMax = imageData.width * imageData.height; index < indexMax; index += 4) {
    const color = replacerFunc(data[ index ])
    if (color) data[ index ] = color
  }
}
const drawPixel = (imageData, x, y, color) => ((new Uint32Array(imageData.data.buffer))[ x + y * imageData.width ] = color)
const drawPixelLine = (imageData, point0, point1, color) => {
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
    drawPixel(imageData, x0, y0, color)
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
}
const drawPixelLineList = (imageData, pointList, color, isLoop) => {
  if (pointList.length <= 1) throw new Error(`[drawPixelLineList] error pointList length: ${pointList.length}`)
  let fromPoint = isLoop ? pointList[ pointList.length - 1 ] : pointList[ 0 ]
  let pointIndex = isLoop ? 0 : 1
  while (pointIndex < pointList.length) {
    drawPixelLine(imageData, fromPoint, pointList[ pointIndex ], color)
    fromPoint = pointList[ pointIndex ]
    pointIndex++
  }
}

const scale = (imageData, scaleX, scaleY = scaleX) => {
  const sourceImageData = imageData
  const sourcePixelWidth = sourceImageData.width
  const sourcePixelArray = new Uint32Array(sourceImageData.data.buffer)
  __DEV__ && console.log('[scale] sourceImageData size:', sourceImageData.width, sourceImageData.height)

  const targetImageData = getQuickContext2d().getImageData(0, 0, sourcePixelWidth * scaleX, sourceImageData.height * scaleY)
  const targetPixelWidth = targetImageData.width
  const targetPixelArray = new Uint32Array(targetImageData.data.buffer)
  __DEV__ && console.log('[scale] targetImageData size:', targetImageData.width, targetImageData.height)

  for (let index = 0, indexMax = targetPixelWidth * targetImageData.height; index < indexMax; index++) {
    const targetX = index % targetPixelWidth
    const targetY = Math.floor(index / targetPixelWidth)
    const sourceX = Math.floor(targetX / scaleX)
    const sourceY = Math.floor(targetY / scaleY)
    const sourcePixelIndex = (sourceX + sourceY * sourcePixelWidth)
    targetPixelArray[ index ] = sourcePixelArray[ sourcePixelIndex ]
  }
  return targetImageData
}

const crop = (imageData, cropCheckFunc) => {
  const sourceWidth = imageData.width
  const sourceHeight = imageData.height
  const sourcePixelArray = new Uint32Array(imageData.data.buffer)
  __DEV__ && console.log('[crop] size before', sourceWidth, sourceHeight)

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (let index = 0, indexMax = sourceWidth * sourceHeight; index < indexMax; index++) {
    if (cropCheckFunc(sourcePixelArray[ index ])) continue // drop this point
    // calc keep rect
    const x = index % sourceWidth
    const y = Math.floor(index / sourceWidth)
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }

  // resize
  const targetWidth = maxX - minX + 1
  const targetHeight = maxY - minY + 1
  __DEV__ && console.log('[crop] size result', minX, minY, targetWidth, targetHeight)
  if (targetWidth <= 0 || targetHeight <= 0) throw new Error('[crop] invalid result size')
  __DEV__ && console.log('[crop] size after', targetWidth, targetHeight)

  const bufferCanvasContext2D = getQuickContext2d(targetWidth, targetHeight)
  bufferCanvasContext2D.putImageData(imageData, 0 - minX, 0 - minY, minX, minY, targetWidth, targetHeight)
  return bufferCanvasContext2D.getImageData(0, 0, targetWidth, targetHeight)
}

const floodFill = (imageData, { x, y }, toColor) => {
  x = Math.round(x)
  y = Math.round(y)
  const { width, height } = imageData
  const data = new Uint32Array(imageData.data.buffer)
  const fromColor = data[ y * width + x ]
  if (fromColor === toColor) return // check initial point
  floodFillStackLoop([ { x, y } ], data, width, height, fromColor, toColor)
}
const floodFillStackLoop = (markPointList, data, width, height, fromColor, toColor) => { // stack loop
  const checkPixelColor = (x, y, color) => data[ y * width + x ] === color
  const putPixel = (x, y, color) => (data[ y * width + x ] = color)

  const comboPush = (xLeft, xRight, checkY) => {
    let checkX = xLeft + 1
    let isCombo = false
    while (checkX < xRight) {
      if (!checkPixelColor(checkX, checkY, fromColor)) isCombo = false
      else if (!isCombo) {
        isCombo = true
        markPointList.push({ x: checkX, y: checkY })
      }
      checkX++
    }
  }

  while (markPointList.length) { // loop marked points
    const { x, y } = markPointList.pop()
    if (!checkPixelColor(x, y, fromColor)) continue
    putPixel(x, y, toColor) // paint current point
    let xLeft = x - 1
    while (xLeft >= 0 && checkPixelColor(xLeft, y, fromColor)) { // left expand
      putPixel(xLeft, y, toColor)
      xLeft--
    }
    let xRight = x + 1
    while (xRight < width && checkPixelColor(xRight, y, fromColor)) { // right expand
      putPixel(xRight, y, toColor)
      xRight++
    }
    if (y - 1 >= 0) comboPush(xLeft, xRight, y - 1) // up check
    if (y + 1 < height) comboPush(xLeft, xRight, y + 1) // down check
  }
}

export {
  getPixelColor,
  replacePixelColor,
  drawPixel,
  drawPixelLine,
  drawPixelLineList,
  scale,
  crop,
  floodFill
}
