window.addContent('', `
<div class="flex-column" style="overflow: auto; width: 100vw; align-items: center; font-family: monospace;">
  <canvas id="testFont" width="300" height="120"></canvas>
  <hr />
  <canvas id="testFontMono" width="300" height="120"></canvas>
  <hr />
  <canvas id="testFontBitmap" width="300" height="120"></canvas>
  <hr />
  <div id="soft-keyboard" style="width: 300px;"></div>
</div>
`, async () => {
  const {
    document,
    qS, cE, aCL,
    Dr: {
      Browser: {
        Canvas: {
          Font: { createFontRender, createFontRenderBitmap },
          Color: { uint32FromRgba },
          ImageData: { applyCanvasElementExt, createCanvasElement, canvasElementToCanvasImageData },
          ImageDataOperation: { floodFill }
        }
      }
    }
  } = window

  const FONT_SIZE = 10
  const LINE_HEIGHT = FONT_SIZE + 4
  const SCALE_RATIO = 2.0
  const LIMIT_WIDTH = 300

  const cursorCanvasContext2d = createCanvasElement(
    Math.ceil(LINE_HEIGHT * SCALE_RATIO * 0.1),
    LINE_HEIGHT * SCALE_RATIO
  ).getContext('2d')
  const cursorCanvasImageData = canvasElementToCanvasImageData(cursorCanvasContext2d.canvas)
  floodFill(cursorCanvasImageData, { x: 0, y: 0 }, uint32FromRgba(255, 0, 0, 255))
  cursorCanvasContext2d.putImageData(cursorCanvasImageData, 0, 0)
  const cursorCanvasElementExt = applyCanvasElementExt(cursorCanvasContext2d.canvas)

  {
    const fontCanvasContext2d = qS('#testFont').getContext('2d')
    const fontMonoCanvasContext2d = qS('#testFontMono').getContext('2d')
    const fontBitmapCanvasContext2d = qS('#testFontBitmap').getContext('2d')

    const fontRender = createFontRender()
    fontRender.applyFontConfig({ fontSize: FONT_SIZE, lineHeight: LINE_HEIGHT, fontStyle: 'normal', fontFamily: 'Arial', fillStyle: '#f00' })

    const fontRenderMono = createFontRender()
    fontRenderMono.applyFontConfig({ fontSize: FONT_SIZE, lineHeight: LINE_HEIGHT, fontStyle: 'normal', fontFamily: 'monospace', fillStyle: '#00f' })

    const fontRenderBitmap = createFontRenderBitmap()
    await fontRenderBitmap.loadBitmapFontData('./font-bitmap.json', FONT_SIZE, LINE_HEIGHT)

    const updateRenderedText = (textValue) => {
      fontCanvasContext2d.canvas.width += 0 // clear canvas
      const renderedText = fontRender.renderText(textValue, SCALE_RATIO, LIMIT_WIDTH)
      renderedText.textCanvasElement.width && fontCanvasContext2d.drawImage(renderedText.textCanvasElement, 0, 0)
      cursorCanvasElementExt.draw(fontCanvasContext2d, renderedText.textEndPosition.x + 2, renderedText.textEndPosition.y)

      fontMonoCanvasContext2d.canvas.width += 0 // clear canvas
      const renderedMonoText = fontRenderMono.renderText(textValue, SCALE_RATIO, LIMIT_WIDTH)
      renderedMonoText.textCanvasElement.width && fontMonoCanvasContext2d.drawImage(renderedMonoText.textCanvasElement, 0, 0)
      cursorCanvasElementExt.draw(fontMonoCanvasContext2d, renderedMonoText.textEndPosition.x + 2, renderedMonoText.textEndPosition.y)

      fontBitmapCanvasContext2d.canvas.width += 0 // clear canvas
      const renderedBitmapText = fontRenderBitmap.renderText(textValue, SCALE_RATIO, LIMIT_WIDTH)
      renderedBitmapText.textCanvasElement.width && fontBitmapCanvasContext2d.drawImage(renderedBitmapText.textCanvasElement, 0, 0)
      cursorCanvasElementExt.draw(fontBitmapCanvasContext2d, renderedBitmapText.textEndPosition.x + 2, renderedBitmapText.textEndPosition.y)
    }

    let text = 'You can input by tapping some key...☕'

    updateRenderedText(text)

    document.addEventListener('keydown', (event) => { // check if filter special key
      if (event.key === 'Backspace') text = text.slice(0, -1)
      else if (event.key === 'Tab') text += '\t'
      else if (event.key === 'Enter') text += '\n'
      else return // don't filter, wait for key press
      event.preventDefault()
      updateRenderedText(text)
    })
    document.addEventListener('keypress', (event) => { // processed key code
      text += event.key
      updateRenderedText(text)
    })
  }

  aCL(qS('#soft-keyboard'), [
    ' ', 'Tab', 'Enter', 'Backspace',
    ...[ '!@#$%^&-', '12345678', 'braid', 'PHANTOM', '玩游戏', '☢☀⌚⌛☕' ].join('').split('')
  ].map((key) => cE('button', {
    innerText: key === ' ' ? 'Space' : key,
    onclick: () => document.dispatchEvent(new window.KeyboardEvent(key.length === 1 ? 'keypress' : 'keydown', { key }))
  })))
})
