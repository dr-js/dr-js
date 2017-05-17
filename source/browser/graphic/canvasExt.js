import { EventEmitter } from 'source/common/module'
import { applyPointerEventExtListener } from 'source/browser/input'

const CANVAS_EXT_EVENT = {
  DRAW: 'DRAW',
  UPDATE: 'UPDATE'
}

function createCanvasExt (canvas, eventEmitter = new EventEmitter()) {
  const context2d = canvas.getContext('2d')

  applyPointerEventExtListener(canvas, (eventExtData, eventData) => {
    __DEV__ && console.log('[CanvasExt]', eventExtData.eventExtType)
    eventEmitter.emit(eventExtData.eventExtType, eventExtData, eventData)
  })

  return {
    canvas,
    context2d,
    eventEmitter,
    update: (deltaTime) => eventEmitter.emit(CANVAS_EXT_EVENT.UPDATE, deltaTime),
    clear: () => { canvas.width = canvas.width }
  }
}

export {
  CANVAS_EXT_EVENT,
  createCanvasExt
}