const getRectFromBoundingRect = ({ left, right, top, bottom }) => ({
  min: { x: left, y: top },
  max: { x: right, y: bottom }
})

const isBoundingRectContainPoint = ({ left, right, top, bottom }, { x, y }) =>
  x >= left && x <= right &&
  y >= top && y <= bottom

export { getRectFromBoundingRect, isBoundingRectContainPoint }
