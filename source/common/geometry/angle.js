const DEGREE_TO_RADIAN = Math.PI / 180
const RADIAN_TO_DEGREE = 180 / Math.PI
const degToRad = (degree) => degree * DEGREE_TO_RADIAN
const radToDeg = (radian) => radian * RADIAN_TO_DEGREE

export {
  DEGREE_TO_RADIAN,
  RADIAN_TO_DEGREE,
  degToRad,
  radToDeg
}
