const { document } = window

let BUFFER_CANVAS
let BUFFER_CANVAS_CONTEXT2D
const getQuickCanvas = () => (BUFFER_CANVAS = BUFFER_CANVAS || document.createElement('canvas'))
const getQuickContext2d = () => (BUFFER_CANVAS_CONTEXT2D = BUFFER_CANVAS_CONTEXT2D || getQuickCanvas().getContext('2d'))

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

const createImageElement = (width, height) => Object.assign(document.createElement('img'), { width, height })
const createCanvasElement = (width, height) => Object.assign(document.createElement('canvas'), { width, height })
const createCanvasImageData = (width, height) => new window.ImageData(width, height)

const applyImageElementExt = (imageElement) => {
  const { width, height } = imageElement
  const draw = getElementDraw(imageElement)
  const drawClip = getElementDrawClip(imageElement, width, height)
  return { imageElement, width, height, draw, drawClip }
}
const applyCanvasElementExt = (canvasElement) => {
  const { width, height } = canvasElement
  const draw = getElementDraw(canvasElement)
  const drawClip = getElementDrawClip(canvasElement, width, height)
  return { canvasElement, width, height, draw, drawClip }
}
const applyCanvasImageDataExt = (canvasImageData) => {
  const { width, height } = canvasImageData
  const draw = getCanvasImageDataDraw(canvasImageData)
  const drawClip = getCanvasImageDataDrawClip(canvasImageData, width, height)
  return { canvasImageData, width, height, draw, drawClip }
}

// transform type
const imageElementToCanvasElement = (imageElement) => {
  const canvasElement = createCanvasElement(imageElement.width, imageElement.height)
  canvasElement.getContext('2d').drawImage(imageElement, 0, 0)
  return canvasElement
}
const imageElementToCanvasImageData = (imageElement) => {
  const bufferCanvasContext2D = getQuickContext2d(imageElement.width, imageElement.height)
  bufferCanvasContext2D.drawImage(imageElement, 0, 0)
  return bufferCanvasContext2D.getImageData(0, 0, imageElement.width, imageElement.height)
}
const canvasElementToCanvasImageData = (canvasElement) => canvasElement.getContext('2d').getImageData(0, 0, canvasElement.width, canvasElement.height)
const canvasImageDataToCanvasElement = (canvasImageData) => {
  const canvasElement = createCanvasElement(canvasImageData.width, canvasImageData.height)
  canvasElement.getContext('2d').putImageData(canvasImageData, 0, 0)
  return canvasElement
}

export {
  getQuickCanvas,
  getQuickContext2d,

  createImageElement,
  createCanvasElement,
  createCanvasImageData,

  applyImageElementExt,
  applyCanvasElementExt,
  applyCanvasImageDataExt,

  imageElementToCanvasElement,
  imageElementToCanvasImageData,
  canvasElementToCanvasImageData,
  canvasImageDataToCanvasElement
}
