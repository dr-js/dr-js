const roundFloat = (value) => Math.round(value * 10000) / 10000

// add to absolute value but keep sign
const addAbs = (value, add) => Math.sign(value) * Math.max(0, Math.abs(value) + add)

const euclideanModulo = (value, divisor) => ((value % divisor + divisor) % divisor)

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const smoothstep = (value, min, max) => {
  if (value <= min) return 0
  if (value >= max) return 1
  value = (value - min) / (max - min)
  return value * value * (3 - 2 * value)
}

// linear interpolation
const lerp = (from, to, rate) => from + (to - from) * rate

export {
  roundFloat,
  addAbs,
  euclideanModulo,
  clamp,
  smoothstep,
  lerp
}
