const {
  Common: {
    Time: { now },
    Data: { createToggle },
    // Math: { getRandomInt },
    Function: { repeat },
    Graphic: { Vector3 },
    Module: { UpdateLoop }
  },
  Browser: {
    DOM: { bindLogElement, bindFPSElement },
    Input: {
      POINTER_EVENT_TYPE,
      applyPointerEventListener,
      applyPointerEventExtListener
    },
    PixelEngine: {
      PixelRender,
      PixelCamera,
      PixelModel,
      PixelMotion
    }
  }
} = window.Dr

// const RANDOM_RANGE = 20
// const getRandomPixelList = (count) => {
//   const pixelList = []
//   repeat(count, () => pixelList.push({
//     xyz: [ getRandomInt(RANDOM_RANGE), getRandomInt(RANDOM_RANGE), getRandomInt(RANDOM_RANGE) ],
//     rgba: [ Math.random(), Math.random(), Math.random(), 1 ]
//   }))
//   return pixelList
// }

const THICKNESS = 0
const getCubePixelList = (size) => {
  const pixelList = []
  const sizeHalf = Math.floor(size * 0.5)
  repeat(size, (x) => repeat(size, (y) => repeat(size, (z) => {
    if (x <= THICKNESS || x >= size - 1 - THICKNESS || y <= THICKNESS || y >= size - 1 - THICKNESS || z <= THICKNESS || z >= size - 1 - THICKNESS) {
      pixelList.push({ xyz: [ x - sizeHalf, y - sizeHalf, z - sizeHalf ], rgba: [ x % 2, y / size, z / size, 1 ] }) // rgba: [x / size, y / size, z / size, 1],
    }
  })))
  // add x, y, z, mark
  pixelList.push({ xyz: [ sizeHalf + 10, 0, 0 ], rgba: [ 0, 0, 1, 1 ] })
  pixelList.push({ xyz: [ 0, sizeHalf + 10, 0 ], rgba: [ 1, 0, 0, 1 ] })
  pixelList.push({ xyz: [ 0, 0, sizeHalf + 10 ], rgba: [ 0, 1, 0, 1 ] })
  return pixelList
}

// test model
const samplePixelModelData = {
  xyz: [ 0, 0, 0 ],
  xyzw: [ 0, 0, 0, 1 ],
  parts: [
    {
      name: 'A',
      xyz: [ 0, 0, 0 ],
      xyzw: [ 0, 0, 0, 1 ],
      pixels: getCubePixelList(20)
      // pixels: getRandomPixelList(400 * 300)
      // pixels: [
      //   { xyz: [ 5, 5, 5 ], rgba: [ 0, 0, 0, 1 ] },
      //   { xyz: [ -5, 5, 5 ], rgba: [ 0, 0, 0, 1 ] },
      //   { xyz: [ 5, -5, 5 ], rgba: [ 0, 0, 0, 1 ] },
      //   { xyz: [ 5, 5, -5 ], rgba: [ 0, 0, 0, 1 ] },
      //   { xyz: [ -5, -5, 5 ], rgba: [ 0, 0, 0, 1 ] },
      //   { xyz: [ 5, -5, -5 ], rgba: [ 0, 0, 0, 1 ] },
      //   { xyz: [ -5, 5, -5 ], rgba: [ 0, 0, 0, 1 ] },
      //   { xyz: [ -5, -5, -5 ], rgba: [ 0, 0, 0, 1 ] },
      //
      //   { xyz: [ 0, 0, 0 ], rgba: [ 1, 1, 1, 1 ] },
      //
      //   { xyz: [ 5, 0, 0 ], rgba: [ 0, 0, 0, 1 ] },
      //   { xyz: [ -5, 0, 0 ], rgba: [ 0, 0, 0, 1 ] },
      //   { xyz: [ 0, 5, 0 ], rgba: [ 0, 0, 0, 1 ] },
      //   { xyz: [ 0, -5, 0 ], rgba: [ 0, 0, 0, 1 ] },
      //
      //   { xyz: [ 1, 1, 0 ], rgba: [ 0, 0, 0, 1 ] },
      //   { xyz: [ 2, 2, 0 ], rgba: [ 0, 0, 0, 1 ] },
      //   { xyz: [ 3, 3, 0 ], rgba: [ 0, 0, 0, 1 ] },
      //   { xyz: [ 4, 4, 0 ], rgba: [ 0, 0, 0, 1 ] },
      //   { xyz: [ 5, 5, 0 ], rgba: [ 0, 0, 0, 1 ] },
      //   { xyz: [ 6, 6, 0 ], rgba: [ 0, 0, 0, 1 ] },
      // ]
    },
    {
      name: 'B',
      xyz: [ 10, 0, 0 ],
      xyzw: [ 0, 0, 0, 1 ],
      pixels: [
        { xyz: [ 0, 0, 0 ], rgba: [ 0, 0, 0, 1 ] },
        { xyz: [ 5, 0, 0 ], rgba: [ 1, 0, 0, 1 ] },
        { xyz: [ 0, 5, 0 ], rgba: [ 0, 1, 0, 1 ] },
        { xyz: [ 0, 0, 5 ], rgba: [ 0, 0, 1, 1 ] },
        { xyz: [ 3, 3, 0 ], rgba: [ 0.5, 0.5, 0.5, 1 ] }
      ]
      // pixels: getRandomPixelList(99999)
    }
  ]
}

// test motion
const samplePixelMotionData = {
  fps: 60, // only for frame switching speed, not play FPS
  frames: [
    {
      id: 0, // number, starts from 0
      xyz: [ 0, 0, 0 ],
      xyzw: [ 0, 0, 0, 1 ],
      bones: [
        // {
        // name : 'A',  // string, attaching PixelPart name
        // xyz : [0, 0, 0],
        // xyzw : [0, 0, 0, 1],
        // },
        {
          name: 'B', // string, attaching PixelPart name
          xyz: [ -2, 0, 0 ],
          xyzw: [ 0, 0, 0, 1 ]
        }
      ]
    },
    {
      id: 99, // number, starts from 0
      xyz: [ 0, 0, 0 ],
      xyzw: [ 0, 0, 0, 1 ],
      bones: [
        // {
        // name : 'A',  // string, attaching PixelPart name
        // xyz : [0, 0, 0],
        // xyzw : [0, 0, 0, 1],
        // },
        {
          name: 'B', // string, attaching PixelPart name
          xyz: [ -2, 0, 0 ],
          xyzw: [ 0, 0, 0, 1 ]
        }
      ]
    },
    {
      id: 100, // number, starts from 0
      xyz: [ 0, 0, 0 ],
      xyzw: [ 0, 0, 0, 1 ],
      bones: [
        {
          name: 'A', // string, attaching PixelPart name
          xyz: [ 0, 0, 0 ],
          xyzw: [ 0, 0, 0, 1 ]
        }
        // {
        // name : 'B',  // string, attaching PixelPart name
        // xyz : [2, 0, 0],
        // xyzw : [0, 0, 0, 1],
        // },
      ]
    },
    {
      id: 150, // number, starts from 0
      xyz: [ 0, 0, 0 ],
      xyzw: [ 0.5, 0.5, 0.5, 0.5 ],
      bones: [
        {
          name: 'A', // string, attaching PixelPart name
          xyz: [ 10, 10, 0 ],
          xyzw: [ 0.5, 0.5, 0.5, 0.5 ]
        }
        // {
        // name : 'B',  // string, attaching PixelPart name
        // xyz : [2, 0, 0],
        // xyzw : [0, 0, 0, 1],
        // },
      ]
    },
    {
      id: 200, // number, starts from 0
      xyz: [ 0, 0, 0 ],
      xyzw: [ 0, 0, 0, 1 ],
      bones: [
        {
          name: 'A', // string, attaching PixelPart name
          xyz: [ 0, 0, 0 ],
          xyzw: [ 0, 0, 0, 1 ]
        }
        // {
        // name : 'B',  // string, attaching PixelPart name
        // xyz : [2, 0, 0],
        // xyzw : [0, 0, 0, 1],
        // },
      ]
    }
  ]
}

console.log(samplePixelModelData)

const LOG = bindLogElement(document.getElementById('Log'))
const FPS = bindFPSElement(document.getElementById('FPS'))

const log = (...args) => LOG.log(args.join(' '))

const updateLoop = new UpdateLoop()
updateLoop.start()
updateLoop.add(() => {
  FPS.step()
  FPS.output()
  return true
})

const Toggle = createToggle()
window.Toggle = Toggle

log(`init at: ${now()}`)

// =========================================================================================

const pixelModel = PixelModel.loadData(samplePixelModelData)
const pixelMotion = PixelMotion.loadData(samplePixelMotionData)

// attach
pixelMotion.generateFrameInfo()
pixelMotion.attachModel(pixelModel)
pixelMotion.start(true, 0)

const RENDER_CANVAS_ELEMENT = document.getElementById('Dr.Canvas')
const PIXEL_SCALE = 10 * 0.5 * 2

const pixelRender = new PixelRender()
pixelRender.init(RENDER_CANVAS_ELEMENT, PIXEL_SCALE, RENDER_CANVAS_ELEMENT.width, RENDER_CANVAS_ELEMENT.height)

// right-handed
const pixelCamera = new PixelCamera()
pixelCamera.positionSelf = new Vector3(0, 0, 20)
pixelCamera.positionFocus = new Vector3(0, 0, 0)
pixelCamera.zoom = 0.5
pixelCamera.updateViewProjectionMatrix()

const RENDER_CANVAS_ELEMENT_2 = document.getElementById('Dr.Canvas2')
const PIXEL_SCALE_2 = 10 * 0.5 * 0.5
const pixelCamera2 = new PixelCamera()
const pixelRender2 = new PixelRender()
pixelRender2.init(RENDER_CANVAS_ELEMENT_2, PIXEL_SCALE_2, RENDER_CANVAS_ELEMENT_2.width, RENDER_CANVAS_ELEMENT_2.height)

const renderData = {
  dataTreeRoot: pixelModel
}

const RENDER_CANVAS_ELEMENT_3 = document.getElementById('Dr.Canvas3')
const RENDER_CANVAS_CONTEXT_3 = RENDER_CANVAS_ELEMENT_3.getContext('2d')

updateLoop.add((deltaTime) => {
  Toggle.get('Draw_Motion') && pixelMotion.update(deltaTime)

  pixelRender.clearBuffer()
  pixelRender.render(pixelCamera, renderData)
  pixelRender.applyBuffer()

  pixelCamera2.copy(pixelCamera)
  pixelCamera2.zoom = 0.5 * 2 * 2

  pixelRender2.clearBuffer()
  pixelRender2.render(pixelCamera2, renderData)
  pixelRender2.applyBuffer()

  RENDER_CANVAS_ELEMENT_3.width += 0
  RENDER_CANVAS_CONTEXT_3.globalAlpha = 0.3
  RENDER_CANVAS_CONTEXT_3.drawImage(RENDER_CANVAS_ELEMENT, 0, 0)
  RENDER_CANVAS_CONTEXT_3.globalAlpha = 1.0
  RENDER_CANVAS_CONTEXT_3.drawImage(RENDER_CANVAS_ELEMENT_2, 0, 0)

  return true
})

RENDER_CANVAS_ELEMENT.addEventListener('contextmenu', (event) => { event.preventDefault() })

applyPointerEventListener(RENDER_CANVAS_ELEMENT, (eventData) => {
  if (Toggle.get('Pixel_Select') === true) {
    // const result = pixelRender.rayTracing(
    const result = pixelRender.rayTracingNearest(pixelCamera, renderData, eventData.positionTarget.x, eventData.positionTarget.y, 0)

    if (result && result.pixel) {
      result.pixel.color.setRGBA(Math.random(), Math.random(), Math.random(), 1)
      // Dr.TAG_TEXT_TAG_3.text = '[SELECTED PIXEL] x:' + result.pixel.position.x + ' y:' + result.pixel.position.y + ' z:' + result.pixel.position.z
    }
  }
})

applyPointerEventExtListener(RENDER_CANVAS_ELEMENT, (eventExtData, eventData) => {
  if (eventExtData.eventExtType === POINTER_EVENT_TYPE.EXT_DRAGGING) {
    eventData.event.preventDefault()

    // move camera
    // pixelCamera.positionFocus.x = (eventExtData.positionCurrent.x - eventExtData.positionPrev.x);
    // pixelCamera.positionFocus.y = (eventExtData.positionCurrent.y - eventExtData.positionPrev.y);

    const x = eventExtData.positionCurrent.x - eventExtData.positionPrev.x
    const y = -(eventExtData.positionCurrent.y - eventExtData.positionPrev.y) // canvas y is inverted

    if (eventData.event.touches) eventData.event.button = eventData.event.touches.length - 1

    if (Toggle.get[ 'Camera_Control_Alt' ] === true) {
      switch (eventData.event.button) {
        case 0: // primaryButton
          pixelCamera.rotateAroundSelfSphere(x, y, 0.01)
          break
        case 1: // scrollButton
          pixelCamera.pan(0, 0, y, 0.2, true)
          break
        case 2: // secondaryButton
          pixelCamera.zoom += x * 0.01
          break
      }
    } else {
      switch (eventData.event.button) {
        case 0: // primaryButton
          pixelCamera.rotateAroundTargetSphere(x, y, 0.01)
          break
        case 1: // scrollButton
          pixelCamera.pan(0, 0, y, 0.2)
          break
        case 2: // secondaryButton
          pixelCamera.pan(x, y, 0, 0.2)
          break
      }
    }
    // Dr.TAG_TEXT_TAG_2.text =
    //   '[CAMERA] (' +
    //   pixelCamera.positionSelf.x.toFixed(2) + ', ' +
    //   pixelCamera.positionSelf.y.toFixed(2) + ', ' +
    //   pixelCamera.positionSelf.z.toFixed(2) + ') ' +
    //   '[FOCUS] (' +
    //   pixelCamera.positionFocus.x.toFixed(2) + ', ' +
    //   pixelCamera.positionFocus.y.toFixed(2) + ', ' +
    //   pixelCamera.positionFocus.z.toFixed(2) + ') ' +
    //   '[ZOOM] x' + pixelCamera.zoom.toFixed(2)

    pixelCamera.updateViewProjectionMatrix()
  }

  if (eventExtData.eventExtType === POINTER_EVENT_TYPE.EXT_CLICK) {
    console.log('[click at]', pixelRender.workingPositionFromOutput(eventData.positionTarget.x, eventData.positionTarget.y, 0))
  }
})
