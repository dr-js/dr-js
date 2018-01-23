// mostly modified from: https://github.com/mrdoob/three.js/tree/dev/src/math
// 2D rectangle: { min: 2D.Vec(), max: 2D.Vec() }

import { min, max } from 'vec'

const isEmpty = ({ min, max }) => max.x <= min.x || max.y <= min.y

const getCenter = ({ min, max }) => ({
  x: (min.x + max.x) * 0.5,
  y: (min.y + max.y) * 0.5
})

const getSize = ({ min, max }) => ({
  x: max.x - min.x,
  y: max.y - min.y
})

const getEmptyRect = () => ({
  min: { x: Infinity, y: Infinity },
  max: { x: -Infinity, y: -Infinity }
})

const getRectFromPoint = (a, b) => ({
  min: min(a, b),
  max: max(a, b)
})

const getUnionRect = (a, b) => ({
  min: min(a.min, b.min),
  max: max(a.max, b.max)
})

const getUnionRectOfList = (rectList) => rectList.reduce((o, rect) => {
  o.min.x = Math.min(o.min.x, rect.min.x)
  o.min.y = Math.min(o.min.y, rect.min.y)
  o.max.x = Math.max(o.max.x, rect.max.x)
  o.max.y = Math.max(o.max.y, rect.max.y)
  return o
}, getEmptyRect())

const isIntersect = (a, b) => !(
  a.max.x < b.min.x || a.min.x > b.max.x ||
  a.max.y < b.min.y || a.min.y > b.max.y
)

const isContain = (a, b) =>
  a.min.x <= b.min.x && a.max.x >= b.max.x &&
  a.min.y <= b.min.y && a.max.y >= b.max.y

const isContainPoint = ({ min, max }, { x, y }) =>
  x >= min.x && x <= max.x &&
  y >= min.y && y <= max.y

export {
  isEmpty,
  getCenter,
  getSize,
  getEmptyRect,
  getRectFromPoint,
  getUnionRect,
  getUnionRectOfList,
  isIntersect,
  isContain,
  isContainPoint
}
