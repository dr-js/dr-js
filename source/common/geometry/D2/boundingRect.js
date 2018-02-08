// 2D rectangle: { left: float, right: float, top: float, bottom: float }

const fromEmpty = () => ({ left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity })

const fromPoint = (a, b) => ({
  left: Math.min(a.x, b.x),
  right: Math.max(a.x, b.x),
  top: Math.min(a.y, b.y),
  bottom: Math.max(a.y, b.y)
})

const fromWidget = ({ center, size, rotate }) => {
  const cos = Math.cos(rotate)
  const sin = Math.sin(rotate)
  const halfBoundingWidth = (Math.abs(size.x * cos) + Math.abs(size.y * sin)) * 0.5
  const halfBoundingHeight = (Math.abs(size.x * sin) + Math.abs(size.y * cos)) * 0.5
  return {
    left: center.x - halfBoundingWidth,
    right: center.x + halfBoundingWidth,
    top: center.y - halfBoundingHeight,
    bottom: center.y + halfBoundingHeight
  }
}

const fromWidgetList = (widgetList) => widgetList.reduce((boundingRect, { center, size, rotate }) => {
  const cos = Math.cos(rotate)
  const sin = Math.sin(rotate)
  const halfBoundingWidth = (Math.abs(size.x * cos) + Math.abs(size.y * sin)) * 0.5
  const halfBoundingHeight = (Math.abs(size.x * sin) + Math.abs(size.y * cos)) * 0.5
  boundingRect.left = Math.min(boundingRect.left, center.x - halfBoundingWidth)
  boundingRect.right = Math.max(boundingRect.right, center.x + halfBoundingWidth)
  boundingRect.top = Math.min(boundingRect.top, center.y - halfBoundingHeight)
  boundingRect.bottom = Math.max(boundingRect.bottom, center.y + halfBoundingHeight)
  return boundingRect
}, fromEmpty())

const getCenter = ({ left, right, top, bottom }) => ({
  x: (left + right) * 0.5,
  y: (top + bottom) * 0.5
})

const getUnion = (a, b) => ({
  left: Math.min(a.left, b.left),
  right: Math.max(a.right, b.right),
  top: Math.min(a.top, b.top),
  bottom: Math.max(a.bottom, b.bottom)
})

const isIntersect = (a, b) => !(
  a.left > b.right ||
  a.right < b.left ||
  a.top > b.bottom ||
  a.bottom < b.top
)

const isContainPoint = ({ left, right, top, bottom }, { x, y }) =>
  x >= left && x <= right &&
  y >= top && y <= bottom

export {
  fromEmpty,
  fromPoint,
  fromWidget,
  fromWidgetList,
  getCenter,
  getUnion,
  isIntersect,
  isContainPoint
}
