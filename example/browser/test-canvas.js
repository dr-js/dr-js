window.addContent(``, `
<div class="flex-column" style="overflow: auto; width: 100vw; align-items: center; font-family: monospace;">
  <div class="flex-row">
    <div class="flex-column box">
      <button onclick="Toggle('DRAW_IMAGE_ELEMENT')">DRAW_IMAGE_ELEMENT</button>
      <button onclick="Toggle('DRAW_CANVAS_ELEMENT')">DRAW_CANVAS_ELEMENT</button>
      <button onclick="Toggle('DRAW_CANVAS_IMAGE_DATA')">DRAW_CANVAS_IMAGE_DATA</button>
    </div>
    <div class="flex-column box">
      <button onclick="Toggle('DRAW_COUNT', 10)">DRAW_COUNT 10</button>
      <button onclick="Toggle('DRAW_COUNT', 100)">DRAW_COUNT 100</button>
      <button onclick="Toggle('DRAW_COUNT', 500)">DRAW_COUNT 500</button>
      <button onclick="Toggle('DRAW_COUNT', 1000)">DRAW_COUNT 1000</button>
      <button onclick="Toggle('DRAW_COUNT', 5000)">DRAW_COUNT 5000</button>
      <button onclick="Toggle('DRAW_COUNT', 10000)">DRAW_COUNT 10000</button>
    </div>
  </div>
  <div class="flex-row box">
    <div class="box">
      <canvas id="main-canvas" width="300" height="600"></canvas>
    </div>
  
    <div class="flex-column box">
      <img id="testImageElement" src="" />
      <canvas id="testCanvasElement" width="300" height="50"></canvas>
      <canvas id="testCanvasImageData" width="300" height="50"></canvas>
    </div>
  </div>
</div>
`, () => {
  const {
    Dr: {
      Common: { Time: { now }, Data: { Toggle: { createToggle } } },
      Browser: {
        Input: { PointerEvent: { applyPointerEventListener, applyEnhancedPointerEventListener } },
        Graphic: { ImageData: { applyImageElementExt, applyCanvasElementExt, applyCanvasImageDataExt } }
      }
    },
    qS,
    log,
    updateLoop
  } = window

  const fitCanvas = (canvas, dPR = window.devicePixelRatio || 1) => {
    const width = canvas.width || parseInt(canvas.style.width)
    const height = canvas.height || parseInt(canvas.style.height)
    const scale = Math.min(document.body.offsetWidth * 0.9 / width, 1)
    canvas.width = Math.floor(scale * width * dPR)
    canvas.height = Math.floor(scale * height * dPR)
    canvas.style.width = `${Math.floor(scale * width)}px`
    canvas.style.height = `${Math.floor(scale * height)}px`
  }

  fitCanvas(qS('#main-canvas'))

  const fontSize = 50
  const drawText = (context2d, text, fillStyle) => {
    context2d.canvas.width += 0
    Object.assign(context2d, { font: `bold ${fontSize}px monospace`, textAlign: 'left', textBaseline: 'middle', fillStyle })
    context2d.fillText(text, 0, fontSize * 0.5)
  }

  const testCanvasElementContext2d = qS('#testCanvasElement').getContext('2d')

  drawText(testCanvasElementContext2d, 'ImageElement', '#500')
  qS('#testImageElement').src = testCanvasElementContext2d.canvas.toDataURL()

  drawText(testCanvasElementContext2d, 'CanvasElement', '#050')

  drawText(qS('#testCanvasImageData').getContext('2d'), 'CanvasImageData', '#005')

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
    onEvent: (name, event) => { console.log(name, event.type, event.pointerType) },
    onEnhancedEvent: (name, eventState) => { console.log(name, eventState.event.type, eventState.event.pointerType) }
  })
})
