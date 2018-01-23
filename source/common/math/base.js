const roundFloat = (value) => Math.round(value * 10000) / 10000

// min max
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const euclideanModulo = (value, divisor) => ((value % divisor + divisor) % divisor)
const smoothstep = (value, min, max) => {
  if (value <= min) return 0
  if (value >= max) return 1
  value = (value - min) / (max - min)
  return value * value * (3 - 2 * value)
}

export {
  roundFloat,

  clamp,
  euclideanModulo,
  smoothstep
}
