// angle: float(radian)

const DEGREE_TO_RADIAN = Math.PI / 180
const RADIAN_TO_DEGREE = 180 / Math.PI
const fromDegree = (degree) => degree * DEGREE_TO_RADIAN
const getDegree = (radian) => radian * RADIAN_TO_DEGREE

export {
  DEGREE_TO_RADIAN,
  RADIAN_TO_DEGREE,
  fromDegree,
  getDegree
}
