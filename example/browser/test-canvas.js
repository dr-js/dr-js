window.addContent(``, `
<div class="flex-column" style="overflow: auto; width: 100vw; align-items: center; font-family: monospace;">
  <div class="flex-row">
    <div class="flex-column box">
      <pre id="toggle-state"></pre>
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
    qS,
    log,
    updateLoop,
    Dr: {
      Common: {
        Function: { withRepeat },
        Time: { CLOCK_TO_SECOND, clock },
        Data: { Toggle: { createToggle } }
      },
      Browser: {
        Input: { PointerEvent: { applyPointerEventListener, applyEnhancedPointerEventListener } },
        Graphic: { ImageData: { applyImageElementExt, applyCanvasElementExt, applyCanvasImageDataExt } }
      }
    }
  } = window

  {
    const fitCanvas = (canvas, devicePixelRatio = window.devicePixelRatio || 1) => {
      const width = canvas.width || parseInt(canvas.style.width)
      const height = canvas.height || parseInt(canvas.style.height)
      const scale = Math.min(document.body.offsetWidth * 0.9 / width, 1)
      canvas.width = Math.floor(scale * width * devicePixelRatio)
      canvas.height = Math.floor(scale * height * devicePixelRatio)
      canvas.style.width = `${Math.floor(scale * width)}px`
      canvas.style.height = `${Math.floor(scale * height)}px`
    }
    fitCanvas(qS('#main-canvas'))
  }

  {
    const fontSize = 50
    const drawText = (context2d, text, fillStyle) => {
      context2d.canvas.width += 0
      Object.assign(context2d, { font: `bold ${fontSize}px monospace`, textAlign: 'left', textBaseline: 'middle', fillStyle })
      context2d.fillText(text, 0, fontSize * 0.5)
    }
    const canvasElementContext2d = qS('#testCanvasElement').getContext('2d')
    drawText(canvasElementContext2d, 'ImageElement', '#500')
    qS('#testImageElement').src = canvasElementContext2d.canvas.toDataURL()
    drawText(canvasElementContext2d, 'CanvasElement', '#050')
    drawText(qS('#testCanvasImageData').getContext('2d'), 'CanvasImageData', '#005')
  }

  const mainContext2d = qS('#main-canvas').getContext('2d')
  const { width, height } = qS('#testCanvasElement')
  const imageElementExt = applyImageElementExt(qS('#testImageElement'))
  const canvasElementExt = applyCanvasElementExt(qS('#testCanvasElement'))
  const canvasImageDataExt = applyCanvasImageDataExt(qS('#testCanvasImageData').getContext('2d').getImageData(0, 0, width, height))

  {
    const LOOP_COUNT = 100

    let timer = clock()
    const logTime = (...args) => {
      const prevTimer = timer
      timer = clock()
      const deltaTime = (timer - prevTimer) * CLOCK_TO_SECOND
      log(`[${deltaTime.toFixed(4)}sec|${(1 / deltaTime).toFixed(2)}hz]`, ...args)
    }

    log(`[x${LOOP_COUNT}] Testing draw speed of [draw]`)

    withRepeat(() => imageElementExt.draw(mainContext2d, 0, 0), LOOP_COUNT)
    logTime('imageElementExt - draw')
    withRepeat(() => canvasElementExt.draw(mainContext2d, 0, 50), LOOP_COUNT)
    logTime('canvasElementExt - draw')
    withRepeat(() => canvasImageDataExt.draw(mainContext2d, 0, 100), LOOP_COUNT)
    logTime('canvasImageDataExt - draw')

    log(`[x${LOOP_COUNT}] Testing draw speed of [drawClip]`)
    withRepeat(() => imageElementExt.drawClip(mainContext2d, 0, 200, 50, 20, width, height), LOOP_COUNT)
    logTime('imageElementExt - drawClip')
    withRepeat(() => canvasElementExt.drawClip(mainContext2d, 0, 250, 50, 20, width, height), LOOP_COUNT)
    logTime('canvasElementExt - drawClip')
    withRepeat(() => canvasImageDataExt.drawClip(mainContext2d, 0, 300, 50, 20, width, height), LOOP_COUNT)
    logTime('canvasImageDataExt - drawClip')

    log(`[x${LOOP_COUNT}] Testing draw speed of [drawClip]`)
    withRepeat(() => imageElementExt.drawClip(mainContext2d, 0, 400, 10, 20, width * 0.5, height * 0.3), LOOP_COUNT)
    logTime('imageElementExt - drawClip')
    withRepeat(() => canvasElementExt.drawClip(mainContext2d, 0, 450, 10, 20, width * 0.5, height * 0.3), LOOP_COUNT)
    logTime('canvasElementExt - drawClip')
    withRepeat(() => canvasImageDataExt.drawClip(mainContext2d, 0, 500, 10, 20, width * 0.5, height * 0.3), LOOP_COUNT)
    logTime('canvasImageDataExt - drawClip')
  }

  {
    const toggle = createToggle()
    toggle('DRAW_COUNT', 10)
    toggle('DRAW_IMAGE_ELEMENT', false)
    toggle('DRAW_CANVAS_ELEMENT', false)
    toggle('DRAW_CANVAS_IMAGE_DATA', false)

    window.Toggle = (key, value) => {
      key && toggle(key, value)
      qS('#toggle-state').innerText = JSON.stringify({
        DRAW_IMAGE_ELEMENT: toggle.get('DRAW_IMAGE_ELEMENT'),
        DRAW_CANVAS_ELEMENT: toggle.get('DRAW_CANVAS_ELEMENT'),
        DRAW_CANVAS_IMAGE_DATA: toggle.get('DRAW_CANVAS_IMAGE_DATA'),
        DRAW_COUNT: toggle.get('DRAW_COUNT')
      }, null, '  ')
    }
    window.Toggle()

    let sumTime = 0
    updateLoop.setFunc('draw-image', (deltaTime) => {
      sumTime += deltaTime * 120
      withRepeat((loopedTime) => {
        const { width, height } = mainContext2d.canvas
        const x = (sumTime + loopedTime) % width
        const y1 = sumTime % height
        const y2 = (sumTime + 100) % height
        const y3 = (sumTime + 200) % height
        if (toggle.get('DRAW_IMAGE_ELEMENT')) imageElementExt.draw(mainContext2d, x, y1)
        if (toggle.get('DRAW_CANVAS_ELEMENT')) canvasElementExt.draw(mainContext2d, x, y2)
        if (toggle.get('DRAW_CANVAS_IMAGE_DATA')) canvasImageDataExt.draw(mainContext2d, x, y3)
      }, toggle.get('DRAW_COUNT'))
    })
  }

  mainContext2d.canvas.style.touchAction = 'none'

  applyPointerEventListener({
    element: mainContext2d.canvas,
    onEvent: (type, event) => {
      if (type !== 'MOVE') return
      event.preventDefault()
      updateLoop.pushFunc(() => {
        const MARKER_HALF_SIZE = 2
        const { clientX, clientY } = event
        const { left, top } = mainContext2d.canvas.getBoundingClientRect()
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
    element: mainContext2d.canvas,
    onEvent: (name, event) => { console.log(name, event.type, event.pointerType) },
    onEnhancedEvent: (name, eventState) => { console.log(name, eventState.event.type, eventState.event.pointerType) }
  })
})
