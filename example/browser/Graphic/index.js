const {
  Common: {
    Time: { now },
    Data: { createToggle },
    Module: { createUpdateLoop, EventEmitter }
  },
  Browser: {
    DOM: { bindLogElement, bindFPSElement },
    Font: { createFontRender, createFontRenderBitmap },
    Input: { applyPointerEventDragListener },
    Graphic: {
      applyImageElementExt,
      applyCanvasElementExt,
      applyCanvasImageDataExt,
      createCanvasElement,
      canvasElementToCanvasImageData,
      CANVAS_IMAGE_DATA_OPERATION
    }
  }
} = window.Dr

window.addEventListener('load', () => {
  const LOG = bindLogElement(document.getElementById('Log'))
  const FPS = bindFPSElement(document.getElementById('FPS'))

  const log = (...args) => LOG.log(args.join(' '))

  const updateLoop = createUpdateLoop()
  updateLoop.start()
  updateLoop.add(() => {
    FPS.step()
    FPS.output()
    return true
  })

  log(`init at: ${now()}`)

  // =========================================================================================

  const mainCanvas = document.getElementById('Dr.Canvas')
  const mainContext2d = mainCanvas.getContext('2d')

  const testImageElement = document.getElementById('testImageElement')
  const testCanvasElement = document.getElementById('testCanvasElement')
  const testCanvasImageData = document.getElementById('testCanvasImageData').getContext('2d').getImageData(0, 0, testCanvasElement.width, testCanvasElement.height)

  const imageElementExt = applyImageElementExt(testImageElement)
  const canvasElementExt = applyCanvasElementExt(testCanvasElement)
  const canvasImageDataExt = applyCanvasImageDataExt(testCanvasImageData)

  let timer = now()
  const logTime = (...args) => {
    log(`[${(now() - timer).toFixed(4)}sec|${(1 / (now() - timer)).toFixed(2)}hz]`, ...args)
    timer = now()
  }

  const loopCount = 100
  log(`[x${loopCount}] Testing draw speed of [draw]`)
  for (let i = 0; i < loopCount; i++) imageElementExt.draw(mainContext2d, 0, 0)
  logTime('imageElementExt - draw')
  for (let i = 0; i < loopCount; i++) canvasElementExt.draw(mainContext2d, 0, 50)
  logTime('canvasElementExt - draw')
  for (let i = 0; i < loopCount; i++) canvasImageDataExt.draw(mainContext2d, 0, 100)
  logTime('canvasImageDataExt - draw')

  log(`[x${loopCount}] Testing draw speed of [drawClip]`)
  for (let i = 0; i < loopCount; i++) imageElementExt.drawClip(mainContext2d, 0, 200, 50, 20, testCanvasElement.width, testCanvasElement.height)
  logTime('imageElementExt - drawClip')
  for (let i = 0; i < loopCount; i++) canvasElementExt.drawClip(mainContext2d, 0, 250, 50, 20, testCanvasElement.width, testCanvasElement.height)
  logTime('canvasElementExt - drawClip')
  for (let i = 0; i < loopCount; i++) canvasImageDataExt.drawClip(mainContext2d, 0, 300, 50, 20, testCanvasElement.width, testCanvasElement.height)
  logTime('canvasImageDataExt - drawClip')

  log(`[x${loopCount}] Testing draw speed of [drawClip]`)
  for (let i = 0; i < loopCount; i++) imageElementExt.drawClip(mainContext2d, 0, 400, 10, 20, testCanvasElement.width * 0.5, testCanvasElement.height * 0.3)
  logTime('imageElementExt - drawClip')
  for (let i = 0; i < loopCount; i++) canvasElementExt.drawClip(mainContext2d, 0, 450, 10, 20, testCanvasElement.width * 0.5, testCanvasElement.height * 0.3)
  logTime('canvasElementExt - drawClip')
  for (let i = 0; i < loopCount; i++) canvasImageDataExt.drawClip(mainContext2d, 0, 500, 10, 20, testCanvasElement.width * 0.5, testCanvasElement.height * 0.3)
  logTime('canvasImageDataExt - drawClip')

  // =========================================================================================

  const Toggle = createToggle()
  window.Toggle = Toggle

  Toggle('DRAW_COUNT', 1)
  Toggle('DRAW_IMAGE_ELEMENT', false)
  Toggle('DRAW_CANVAS_ELEMENT', false)
  Toggle('DRAW_CANVAS_IMAGE_DATA', false)

  let sumTime = 0
  const drawFunc = (loopedTime) => {
    const { width, height } = mainCanvas
    const x = (sumTime + loopedTime) % width
    const y1 = sumTime % height
    const y2 = (sumTime + 100) % height
    const y3 = (sumTime + 200) % height
    if (Toggle.get('DRAW_IMAGE_ELEMENT')) imageElementExt.draw(mainContext2d, x, y1)
    if (Toggle.get('DRAW_CANVAS_ELEMENT')) canvasElementExt.draw(mainContext2d, x, y2)
    if (Toggle.get('DRAW_CANVAS_IMAGE_DATA')) canvasImageDataExt.draw(mainContext2d, x, y3)
  }
  updateLoop.add((deltaTime) => {
    sumTime += deltaTime * 120
    let count = 0
    while (count++ <= Toggle.get('DRAW_COUNT')) drawFunc(count)
    return true
  })

  // =========================================================================================

  const eventExtListener = ({ to }, event) => {
    if (!to) return
    const MARKER_HALF_SIZE = 2
    event.preventDefault()
    const { x, y } = to
    updateLoop.add(() => {
      mainContext2d.fillRect(x - MARKER_HALF_SIZE, y - MARKER_HALF_SIZE, MARKER_HALF_SIZE * 2, MARKER_HALF_SIZE * 2)
      return false
    }, 'test-canvas-ext:draw-touch-position') // once
    log(x.toFixed(2), y.toFixed(2))
  }
  applyPointerEventDragListener({ element: mainCanvas, updateDragState: eventExtListener, endDragState: eventExtListener })

  // =========================================================================================

  // test font
  const testFontCanvas = document.getElementById('testFont')
  const testFontCanvasContext2d = testFontCanvas.getContext('2d')

  const testFontBitmapCanvas = document.getElementById('testFontBitmap')
  const testFontBitmapCanvasContext2d = testFontBitmapCanvas.getContext('2d')

  let textValue = 'You can input by tapping some key...'
  const textFontSize = 12
  const textLineHeight = textFontSize + 4
  const textScaleRatio = 2.0
  const textLimitWidth = 300

  const testCanvasElementCursor = createCanvasElement(Math.ceil(textLineHeight * textScaleRatio * 0.1), textLineHeight * textScaleRatio)
  const testCanvasImageDataCursor = canvasElementToCanvasImageData(testCanvasElementCursor)
  CANVAS_IMAGE_DATA_OPERATION.floodFill(testCanvasImageDataCursor, { x: 0, y: 0 }, { r: 255, g: 0, b: 0, a: 255 })
  testCanvasElementCursor.getContext('2d').putImageData(testCanvasImageDataCursor, 0, 0)
  const testCanvasElementExtCursor = applyCanvasElementExt(testCanvasElementCursor)

  const testFontRender = createFontRender()
  testFontRender.applyFontConfig({ fontSize: textFontSize, lineHeight: textLineHeight, fontStyle: 'normal', fontFamily: 'monospace', fillStyle: '#F00' })
  let isBitmapLoaded = false
  const testFontRenderBitmap = createFontRenderBitmap()
  testFontRenderBitmap.loadBitmapFontData('fontBitmap.json', textFontSize, textLineHeight).then(() => {
    isBitmapLoaded = true
    updateRenderedText(textValue)
  })

  const bufferCanvasElement = createCanvasElement(0, 0)
  const updateRenderedText = (textValue) => {
    testFontCanvas.width += 0 // clear canvas
    const renderedText = testFontRender.renderText(textValue, textScaleRatio, textLimitWidth, bufferCanvasElement)
    testFontCanvasContext2d.drawImage(renderedText.textCanvasElement, 0, 0)
    testCanvasElementExtCursor.draw(testFontCanvasContext2d, renderedText.textEndPosition.x + 2, renderedText.textEndPosition.y)

    if (!isBitmapLoaded) return
    testFontBitmapCanvas.width += 0 // clear canvas
    const renderedBitmapText = testFontRenderBitmap.renderText(textValue, textScaleRatio, textLimitWidth, bufferCanvasElement)
    testFontBitmapCanvasContext2d.drawImage(renderedBitmapText.textCanvasElement, 0, 0)
    testCanvasElementExtCursor.draw(testFontBitmapCanvasContext2d, renderedBitmapText.textEndPosition.x + 2, renderedBitmapText.textEndPosition.y)
  }
  updateRenderedText(textValue)

  // =========================================================================================

  document.addEventListener('keydown', (event) => { // check if filter special key
    if (event.key === 'Backspace') textValue = textValue.slice(0, -1)
    else if (event.key === 'Tab') textValue += '\t'
    else if (event.key === 'Enter') textValue += '\n'
    else return // don't filter, wait for key press
    event.preventDefault()
    updateRenderedText(textValue)
  })
  document.addEventListener('keypress', (event) => { // processed key code
    textValue += event.key
    updateRenderedText(textValue)
  })

  // =========================================================================================

  const testEventEmitter = new EventEmitter()

  testEventEmitter.on('TEXT_CONTENT', (nextTextValue) => {
    textValue = nextTextValue
    updateRenderedText(textValue)
  })
  const updateTextValue = (nextTextValue) => (nextTextValue !== textValue && testEventEmitter.emit('TEXT_CONTENT', nextTextValue))

  // soft keyboard
  testFontCanvas.addEventListener('click', () => textSoftKeyboardTextarea.focus())
  testFontBitmapCanvas.addEventListener('click', () => textSoftKeyboardTextarea.focus())

  const textSoftKeyboardTextarea = document.getElementById('textSoftKeyboardTextarea')
  textSoftKeyboardTextarea.addEventListener('focus', () => (textSoftKeyboardTextarea.value = textValue))
  textSoftKeyboardTextarea.addEventListener('input', () => updateTextValue(textSoftKeyboardTextarea.value))
  textSoftKeyboardTextarea.addEventListener('blur', () => updateTextValue(textSoftKeyboardTextarea.value))
  textSoftKeyboardTextarea.addEventListener('keydown', (event) => { // check if filter special key
    if (event.key === 'Backspace') textValue = textValue.slice(0, -1)
    else if (event.key === 'Tab') textValue += '\t'
    else if (event.key === 'Enter') textValue += '\n'
    else return // don't filter, wait for key press
    event.preventDefault()
    textSoftKeyboardTextarea.value = textValue
    updateRenderedText(textValue)
  })
  textSoftKeyboardTextarea.addEventListener('keypress', (event) => { // processed key code
    textValue += event.key
    textSoftKeyboardTextarea.value = textValue
    updateRenderedText(textValue)
  })
})
