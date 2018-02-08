// 2D rectangle: { center: 2D.vector, size: 2D.vector, rotate: angle, ...data: any }

import { roundFloat } from 'source/common/math/base'
import { getDist, getRotate, round as roundVector } from './vector'

const PI_HALF = Math.PI * 0.5

const fromPoint = (pointA, pointB, data) => ({
  ...data,
  center: {
    x: (pointA.x + pointB.x) * 0.5,
    y: (pointA.y + pointB.y) * 0.5
  },
  size: {
    x: Math.abs(pointA.x - pointB.x),
    y: Math.abs(pointA.y - pointB.y)
  },
  rotate: 0
})

const fromLine = ({ begin, end }, width, data) => ({
  ...data,
  center: {
    x: (begin.x + end.x) * 0.5,
    y: (begin.y + end.y) * 0.5
  },
  size: {
    x: width,
    y: getDist(end, begin)
  },
  rotate: getRotate(end, begin) - PI_HALF
})

const fromBoundingRect = ({ left, right, top, bottom }, data) => ({
  ...data,
  center: {
    x: (left + right) * 0.5,
    y: (top + bottom) * 0.5
  },
  size: {
    x: right - left,
    y: bottom - top
  },
  rotate: 0
})

const getBoundingSize = ({ size: { x, y }, rotate }) => {
  const cos = Math.cos(rotate)
  const sin = Math.sin(rotate)
  return {
    x: Math.abs(x * cos) + Math.abs(y * sin),
    y: Math.abs(x * sin) + Math.abs(y * cos)
  }
}
const getBoundingWidth = ({ size: { x, y }, rotate }) =>
  Math.abs(x * Math.cos(rotate)) +
  Math.abs(y * Math.sin(rotate))
const getBoundingHeight = ({ size: { x, y }, rotate }) =>
  Math.abs(x * Math.sin(rotate)) +
  Math.abs(y * Math.cos(rotate))
const getBoundingLeft = (widget) =>
  widget.center.x - getBoundingWidth(widget) * 0.5
const getBoundingRight = (widget) =>
  widget.center.x + getBoundingWidth(widget) * 0.5
const getBoundingTop = (widget) =>
  widget.center.y - getBoundingHeight(widget) * 0.5
const getBoundingBottom = (widget) =>
  widget.center.y + getBoundingHeight(widget) * 0.5

const round = (widget) => ({
  ...widget,
  center: roundVector(widget.center),
  size: roundVector(widget.size),
  rotate: roundFloat(widget.rotate)
})

const localPoint = ({ center, rotate }, { x, y }) => {
  const offsetX = x - center.x
  const offsetY = y - center.y
  const cos = Math.cos(-rotate)
  const sin = Math.sin(-rotate)
  return {
    x: offsetX * cos - offsetY * sin,
    y: offsetX * sin + offsetY * cos
  }
}

const localBoundingRect = ({ center, rotate }, targetWidget) => {
  const offsetX = targetWidget.center.x - center.x
  const offsetY = targetWidget.center.y - center.y
  const offsetRotate = targetWidget.rotate - rotate
  const cos = Math.cos(offsetRotate)
  const sin = Math.sin(offsetRotate)
  const x = offsetX * cos - offsetY * sin
  const y = offsetX * sin + offsetY * cos
  const halfBoundingWidth = (targetWidget.size.x * cos - targetWidget.size.y * sin) * 0.5
  const halfBoundingHeight = (targetWidget.size.x * sin + targetWidget.size.y * cos) * 0.5
  return { // for targetWidget
    left: x - halfBoundingWidth,
    right: x + halfBoundingWidth,
    top: y - halfBoundingHeight,
    bottom: y + halfBoundingHeight
  }
}

const isContainBoundingRect = ({ center, size }, boundingRect) => (
  center.x - size.x * 0.5 <= boundingRect.left &&
  center.x + size.x * 0.5 >= boundingRect.right &&
  center.y - size.y * 0.5 <= boundingRect.top &&
  center.y + size.y * 0.5 >= boundingRect.bottom
)

const isInterceptBoundingRect = ({ center, size }, boundingRect) => !(
  center.x + size.x * 0.5 < boundingRect.left ||
  center.x - size.x * 0.5 > boundingRect.right ||
  center.y + size.y * 0.5 < boundingRect.top ||
  center.y - size.y * 0.5 > boundingRect.bottom
)

export {
  fromPoint,
  fromLine,
  fromBoundingRect,
  getBoundingSize,
  getBoundingWidth,
  getBoundingHeight,
  getBoundingLeft,
  getBoundingRight,
  getBoundingTop,
  getBoundingBottom,
  round,
  localPoint,
  localBoundingRect,
  isContainBoundingRect,
  isInterceptBoundingRect
}
