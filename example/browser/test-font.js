window.addContent('', `
<div class="flex-column" style="overflow: auto; width: 100vw; align-items: center; font-family: monospace;">
  <textarea id="textSoftKeyboardTextarea" style="z-index: -1; width: 1px; height: 1px;"></textarea>
  <canvas id="testFont" width="400" height="200"></canvas>
  <canvas id="testFontBitmap" width="400" height="200"></canvas>
</div>
`, () => {
  const {
    Dr: {
      Common: { Module: { Event: { createEventEmitter } } },
      Browser: {
        Font: { createFontRender, createFontRenderBitmap },
        Graphic: {
          ImageData: { applyCanvasElementExt, createCanvasElement, canvasElementToCanvasImageData },
          CanvasImageDataOperation: { floodFill },
          Color: { getUint32RGBA }
        }
      }
    },
    qS
  } = window

  // test font
  const testFontCanvas = qS('#testFont')
  const testFontCanvasContext2d = testFontCanvas.getContext('2d')

  const testFontBitmapCanvas = qS('#testFontBitmap')
  const testFontBitmapCanvasContext2d = testFontBitmapCanvas.getContext('2d')

  let textValue = 'You can input by tapping some key...'
  const textFontSize = 12
  const textLineHeight = textFontSize + 4
  const textScaleRatio = 2.0
  const textLimitWidth = 300

  const testCanvasElementCursor = createCanvasElement(Math.ceil(textLineHeight * textScaleRatio * 0.1), textLineHeight * textScaleRatio)
  const testCanvasImageDataCursor = canvasElementToCanvasImageData(testCanvasElementCursor)
  floodFill(testCanvasImageDataCursor, { x: 0, y: 0 }, getUint32RGBA(255, 0, 0, 255))
  testCanvasElementCursor.getContext('2d').putImageData(testCanvasImageDataCursor, 0, 0)
  const testCanvasElementExtCursor = applyCanvasElementExt(testCanvasElementCursor)

  const testFontRender = createFontRender()
  testFontRender.applyFontConfig({ fontSize: textFontSize, lineHeight: textLineHeight, fontStyle: 'normal', fontFamily: 'monospace', fillStyle: '#F00' })
  let isBitmapLoaded = false
  const testFontRenderBitmap = createFontRenderBitmap()
  testFontRenderBitmap.loadBitmapFontData('../resource/fontBitmap.json', textFontSize, textLineHeight).then(() => {
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

  const testEventEmitter = createEventEmitter()

  testEventEmitter.on('TEXT_CONTENT', (nextTextValue) => {
    textValue = nextTextValue
    updateRenderedText(textValue)
  })
  const updateTextValue = (nextTextValue) => (nextTextValue !== textValue && testEventEmitter.emit('TEXT_CONTENT', nextTextValue))

  // soft keyboard
  testFontCanvas.addEventListener('click', () => textSoftKeyboardTextarea.focus())
  testFontBitmapCanvas.addEventListener('click', () => textSoftKeyboardTextarea.focus())

  const textSoftKeyboardTextarea = qS('#textSoftKeyboardTextarea')
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
