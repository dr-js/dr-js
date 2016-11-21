// min max
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const euclideanModulo = (n, m) => ((n % m + m) % m)
const smoothstep = (x, min, max) => {
  if (x <= min) return 0
  if (x >= max) return 1
  x = (x - min) / (max - min)
  return x * x * (3 - 2 * x)
}

// geometry
const degreeToRadiansFactor = Math.PI / 180
const radianToDegreesFactor = 180 / Math.PI
const degToRad = (degrees) => (degrees * degreeToRadiansFactor)
const radToDeg = (radians) => (radians * radianToDegreesFactor)

export {
  clamp,
  euclideanModulo,
  smoothstep,

  degreeToRadiansFactor,
  radianToDegreesFactor,
  degToRad,
  radToDeg
}
