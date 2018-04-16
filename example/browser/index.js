const {
  Common: {
    Time: { now },
    Math: { easeOutCubic, easeInOutQuad },
    Data: { Toggle: { createToggle } },
    Geometry: { D2: { Vector } },
    Module: {
      UpdateLoop: { createUpdateLoop },
      Event: { createEventEmitter }
    }
  },
  Browser: {
    Font: { createFontRender, createFontRenderBitmap },
    Input: {
      PointerEvent: { applyPointerEventListener, applyEnhancedPointerEventListener },
      EnhancedEventProcessor: { createSwipeEnhancedEventProcessor }
    },
    Graphic: {
      ImageData: {
        applyImageElementExt,
        applyCanvasElementExt,
        applyCanvasImageDataExt,
        createCanvasElement,
        canvasElementToCanvasImageData
      },
      Color: { getUint32RGBA },
      CanvasImageDataOperation
    }
  }
} = window.Dr

const bindLogElement = (element) => {
  const logTextList = []
  let logTextListLengthMax = 20 // max logTextList length
  let prevTime = now()
  const log = (text) => {
    const currentTime = now()
    logTextList.unshift(`[+${(currentTime - prevTime).toFixed(4)}s] ${text}`) // add to head of the array
    prevTime = currentTime
    if (logTextList.length > logTextListLengthMax) logTextList.length = logTextListLengthMax
    output()
  }
  const output = () => (element.innerHTML = logTextList.join('<br />'))
  return { log, output }
}

const bindFPSElement = (element) => {
  const fpsList = []
  let fpsListLengthMax = 20 // max logTextList length
  let prevTime = now()
  const step = () => {
    const currentTime = now()
    const stepTime = currentTime - prevTime
    prevTime = currentTime
    fpsList.unshift(1 / stepTime)
    if (fpsList.length > fpsListLengthMax) fpsList.length = fpsListLengthMax
    return stepTime
  }
  const output = () => {
    const averageFps = fpsList.reduce((o, v) => (o + v), 0) / fpsList.length
    element.innerHTML = `AVG: ${averageFps.toFixed(2)} | FPS: ${fpsList[ 0 ].toFixed(2)}`
  }
  return { step, output }
}

const bindSwipeElement = (element = document.createElement('div'), targetMarkElement) => {
  const { x, y } = element.getBoundingClientRect()
  let currentPoint = { x, y }
  const getTimeToDistanceFromVelocityAccelerate = (s, v, a) => {
    if (a === 0) return s / v
    // att + vt = s
    // att + vt + pow(v/2/sqrt(a), 2) = s + pow(v/2/sqrt(a), 2)
    // pow((sqrt(a)t + v/2/sqrt(a)), 2) = s + pow(v/2/sqrt(a), 2)
    // sqrt(a)t + v/2/sqrt(a) = sqrt(s + pow(v/2/sqrt(a), 2))
    // sqrt(a)t = sqrt(s + pow(v/2/sqrt(a), 2)) - v/2/sqrt(a)
    // t = sqrt(s + pow(v/2/sqrt(a), 2))/sqrt(a) - v/2/sqrt(a)/sqrt(a)
    // t = sqrt(s/a + pow(v/2/a, 2)) - v/2/a
    const temp = 0.5 * v / a
    return Math.sqrt(s / a + temp * temp) - temp
  }
  const { onEnhancedEvent, onEvent } = createSwipeEnhancedEventProcessor({
    getOrigin: (event) => {
      event.preventDefault()
      return currentPoint
    },
    updateOrigin: (origin) => {
      const { width, height } = element.getBoundingClientRect()
      currentPoint = {
        x: Math.max(0, Math.min(document.documentElement.clientWidth - width, origin.x)),
        y: Math.max(0, Math.min(document.documentElement.clientHeight - height, origin.y))
      }
      element.style.transform = `translate(${Math.round(currentPoint.x)}px,${Math.round(currentPoint.y)}px)`
    },
    getExitInfo: ({ exitVector, pointCurrent, pointOrigin }) => {
      const exitSpeed = Vector.getLength(exitVector)
      const pointExit = Vector.getDist(pointCurrent, pointOrigin) + exitSpeed * 0.25 < 256
        ? pointOrigin
        : Vector.add(pointCurrent, Vector.scale(exitVector, 0.25))
      const targetVector = Vector.sub(pointExit, pointCurrent)
      const targetDistance = Vector.getLength(targetVector)
      const exitDuration = targetDistance ? getTimeToDistanceFromVelocityAccelerate(targetDistance, exitSpeed, 5000)
        : 0
      targetMarkElement.style.transform = `translate(${Math.round(pointExit.x)}px,${Math.round(pointExit.y)}px)`
      return { pointExit, exitDuration }
    },
    normalizeVector: ({ x, y }) => Math.abs(x) >= Math.abs(y)
      ? { x, y: 0 }
      : { x: 0, y }, // can lock result direction
    timeFunction: easeInOutQuad
  })
  applyEnhancedPointerEventListener({ element, onEnhancedEvent, onEvent, isGlobal: true, isCancelOnOutOfBound: false })
}

const bindScrollElement = (element = document.createElement('div')) => {
  const { x, y } = element.getBoundingClientRect()
  let currentPoint = { x, y }
  const { onEnhancedEvent, onEvent } = createSwipeEnhancedEventProcessor({
    getOrigin: (event) => {
      event.preventDefault()
      return currentPoint
    },
    updateOrigin: (origin) => {
      const { width, height } = element.getBoundingClientRect()
      currentPoint = {
        x: Math.max(0, Math.min(document.documentElement.clientWidth - width, origin.x)),
        y: Math.max(0, Math.min(document.documentElement.clientHeight - height, origin.y))
      }
      element.style.transform = `translate(${Math.round(currentPoint.x)}px,${Math.round(currentPoint.y)}px)`
    },
    getExitInfo: ({ exitVector, pointCurrent, pointOrigin }) => {
      const exitDuration = Math.abs(Vector.getLength(exitVector) / -5000)
      const pointExit = Vector.add(pointCurrent, Vector.scale(exitVector, exitDuration * 0.5))
      return { pointExit, exitDuration }
    },
    timeFunction: easeOutCubic
  })
  applyEnhancedPointerEventListener({ element, onEnhancedEvent, onEvent, isGlobal: true, isCancelOnOutOfBound: false })
}

window.addEventListener('load', () => {
  const qS = (selector) => document.querySelector(selector)

  const LOG = bindLogElement(qS('#Log'))
  const FPS = bindFPSElement(qS('#FPS'))
  bindSwipeElement(qS('#SWIPE'), qS('#SWIPE-TARGET'))
  bindScrollElement(qS('#SCROLL'))

  const log = (...args) => LOG.log(args.join(' '))

  const updateLoop = createUpdateLoop()
  updateLoop.start()
  updateLoop.setFunc('fps', () => {
    FPS.step()
    FPS.output()
  })

  log(`init at: ${now()}`)

  // =========================================================================================

  const mainCanvas = qS('#main-canvas')
  const mainContext2d = mainCanvas.getContext('2d')

  const testImageElement = qS('#testImageElement')
  const testCanvasElement = qS('#testCanvasElement')
  const testCanvasImageData = qS('#testCanvasImageData').getContext('2d').getImageData(0, 0, testCanvasElement.width, testCanvasElement.height)

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
  updateLoop.setFunc('draw-image', (deltaTime) => {
    sumTime += deltaTime * 120
    let count = 0
    while (count++ <= Toggle.get('DRAW_COUNT')) drawFunc(count)
  })

  // =========================================================================================

  mainCanvas.style.touchAction = 'none'

  applyPointerEventListener({
    element: mainCanvas,
    onEvent: (type, event) => {
      if (type !== 'MOVE') return
      event.preventDefault()
      updateLoop.pushFunc(() => {
        const MARKER_HALF_SIZE = 2
        const { clientX, clientY } = event
        const { left, top } = mainCanvas.getBoundingClientRect()
        const x = clientX - left
        const y = clientY - top
        mainContext2d.fillRect(x - MARKER_HALF_SIZE, y - MARKER_HALF_SIZE, MARKER_HALF_SIZE * 2, MARKER_HALF_SIZE * 2)
        log(x.toFixed(2), y.toFixed(2))
      }, 'test-canvas-ext:draw-touch-position') // once
    },
    isGlobal: true,
    isCancel: false,
    isCancelOnOutOfBound: false
  })

  applyEnhancedPointerEventListener({
    element: mainCanvas,
    onEvent: (name, event) => {
      console.log(name, event.type, event.pointerType)
    },
    onEnhancedEvent: (name, event) => {
      console.log(name, event.type, event.pointerType)
    }
  })

  // =========================================================================================

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
  CanvasImageDataOperation.floodFill(testCanvasImageDataCursor, { x: 0, y: 0 }, getUint32RGBA(255, 0, 0, 255))
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
