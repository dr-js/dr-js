// mostly modified from: https://github.com/mrdoob/three.js/tree/dev/src/math
// 2D vector: { x, y }

const getDist = (a, b) => Math.sqrt(getDistSq(a, b))
const getDistSq = (a, b) => {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return dx * dx + dy * dy
}

// from axis x+(0) to y+(PI/2)
const getAngleRad = ({ x, y }) => {
  const radian = Math.atan2(y, x)
  return radian >= 0 ? radian : radian + 2 * Math.PI
}
const getRotateRad = (a, b) => {
  const radian = Math.atan2(a.y - b.y, a.x - b.x)
  return radian >= 0 ? radian : radian + 2 * Math.PI
}
const getRotateDeltaRad = (anchor, from, to) => {
  const radian = Math.atan2(anchor.y - to.y, anchor.x - to.x) - Math.atan2(anchor.y - from.y, anchor.x - from.x)
  return radian >= 0 ? radian : radian + 2 * Math.PI
}

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

export {
  getDist,
  getDistSq,
  getAngleRad,
  getRotateRad,
  getRotateDeltaRad,
  add,
  sub,
  multiply,
  divide,
  scale,
  min,
  max,
  clamp
}