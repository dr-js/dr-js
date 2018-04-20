// mostly modified from: https://github.com/mrdoob/three.js/tree/dev/src/math
// 2D vector: { x: float, y: float }

const PI_DOUBLE = Math.PI * 2

const fromOrigin = () => ({ x: 0, y: 0 })
const fromAngleLength = (angle, length) => ({
  x: length * Math.cos(angle),
  y: length * Math.sin(angle)
})

const getLength = ({ x, y }) => Math.sqrt(x * x + y * y)
const getLengthSq = ({ x, y }) => x * x + y * y

const getDist = (a, b) => Math.sqrt(getDistSq(a, b))
const getDistSq = (a, b) => {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return dx * dx + dy * dy
}

// from axis x+(0) to y+(PI/2)
const getAngle = ({ x, y }) => {
  const radian = Math.atan2(y, x)
  return radian >= 0 ? radian : radian + PI_DOUBLE
}
const getRotate = (a, b) => {
  const radian = Math.atan2(a.y - b.y, a.x - b.x)
  return radian >= 0 ? radian : radian + PI_DOUBLE
}
const getRotateDelta = (anchor, from, to) => {
  const radian =
    Math.atan2(anchor.y - to.y, anchor.x - to.x) -
    Math.atan2(anchor.y - from.y, anchor.x - from.x)
  return radian >= 0 ? radian : radian + PI_DOUBLE
}
const getDotProduct = (a, b) => a.x * b.x + a.y * b.y

const add = (a, b) => ({
  x: a.x + b.x,
  y: a.y + b.y
})

const sub = (a, b) => ({
  x: a.x - b.x,
  y: a.y - b.y
})

const multiply = (a, b) => ({
  x: a.x * b.x,
  y: a.y * b.y
})

const divide = (a, b) => ({
  x: a.x / b.x,
  y: a.y / b.y
})

const scale = ({ x, y }, scale) => ({
  x: x * scale,
  y: y * scale
})

// project a onto b, result has same direction as b
const project = (a, b) => scale(
  b,
  getDotProduct(a, b) / Math.pow(getLength(b), 2)
)

const min = (a, b) => ({
  x: Math.min(a.x, b.x),
  y: Math.min(a.y, b.y)
})

const max = (a, b) => ({
  x: Math.max(a.x, b.x),
  y: Math.max(a.y, b.y)
})

const clamp = ({ x, y }, min, max) => ({
  x: Math.max(Math.min(x, max.x), min.x),
  y: Math.max(Math.min(y, max.y), min.y)
})

const abs = ({ x, y }) => ({
  x: Math.abs(x),
  y: Math.abs(y)
})

const round = ({ x, y }) => ({
  x: Math.round(x),
  y: Math.round(y)
})

const lerp = (from, to, rate) => ({
  x: from.x + (to.x - from.x) * rate,
  y: from.y + (to.y - from.y) * rate
})

const isZero = ({ x, y }) => x === 0 && y === 0

export {
  fromOrigin,
  fromAngleLength,
  getLength, getLengthSq,
  getDist, getDistSq,
  getAngle,
  getRotate, getRotateDelta,
  getDotProduct,
  add,
  sub,
  multiply,
  divide,
  scale,
  project,
  min,
  max,
  clamp,
  abs,
  round,
  lerp,
  isZero
}
