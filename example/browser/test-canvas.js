window.addContent('', `
<div class="flex-column" style="overflow: auto; width: 100vw; align-items: center; font-family: monospace;">
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
    document,
    qS, log, updateLoop,
    Dr: {
      Browser: {
        Input: { PointerEvent: { applyPointerEventListener, applyEnhancedPointerEventListener } }
      }
    }
  } = window

  const devicePixelRatio = window.devicePixelRatio || 1

  {
    const fitCanvas = (canvas, devicePixelRatio) => {
      const width = canvas.width || parseInt(canvas.style.width)
      const height = canvas.height || parseInt(canvas.style.height)
      const scale = Math.min(document.body.offsetWidth * 0.9 / width, 1)
      canvas.width = Math.floor(scale * width * devicePixelRatio)
      canvas.height = Math.floor(scale * height * devicePixelRatio)
      canvas.style.width = `${Math.floor(scale * width)}px`
      canvas.style.height = `${Math.floor(scale * height)}px`
    }
    fitCanvas(qS('#main-canvas'), devicePixelRatio)
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
        const x = (clientX - left) * devicePixelRatio
        const y = (clientY - top) * devicePixelRatio
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
