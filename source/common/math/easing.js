// rate: range [0, 1]
const linear = (rate) => rate

const easeInQuad = (rate) => rate * rate
const easeOutQuad = (rate) => rate * (2 - rate)
const easeInOutQuad = (rate) => rate < 0.5
  ? rate * rate * 2
  : rate * (2 - rate) * 2 - 1

const easeInCubic = (rate) => Math.pow(rate, 3)
const easeOutCubic = (rate) => Math.pow(rate - 1, 3) + 1
const easeInOutCubic = (rate) => rate < 0.5
  ? Math.pow(rate, 3) * 4
  : Math.pow(rate * 2 - 2, 3) / 2 + 1

const easeInQuart = (rate) => Math.pow(rate, 4)
const easeOutQuart = (rate) => 1 - Math.pow(rate - 1, 4)
const easeInOutQuart = (rate) => rate < 0.5
  ? Math.pow(rate, 4) * 8
  : 1 - Math.pow(rate * 2 - 2, 4) / 2

const easeInQuint = (rate) => Math.pow(rate, 5)
const easeOutQuint = (rate) => Math.pow(rate - 1, 5) + 1
const easeInOutQuint = (rate) => rate < 0.5
  ? Math.pow(rate, 5) * 16
  : Math.pow(rate * 2 - 2, 5) / 2 + 1

const PI_HALF = Math.PI / 2
const easeInSine = (rate) => 1 - Math.cos(rate * PI_HALF)
const easeOutSine = (rate) => Math.sin(rate * PI_HALF)
const easeInOutSine = (rate) => 0.5 - Math.cos(rate * Math.PI) / 2

const easeInExpo = (rate) => Math.pow(2, rate * 10 - 10)
const easeOutExpo = (rate) => 1 - Math.pow(2, rate * -10)
const easeInOutExpo = (rate) => rate < 0.5
  ? Math.pow(2, rate * 20 - 10) / 2
  : 1 - Math.pow(2, 10 - rate * 20) / 2

const easeInCirc = (rate) => 1 - Math.sqrt(1 - rate * rate)
const easeOutCirc = (rate) => Math.sqrt((2 - rate) * rate)
const easeInOutCirc = (rate) => rate < 0.5
  ? 0.5 - Math.sqrt(0.25 - rate * rate)
  : Math.sqrt(rate * (2 - rate) - 0.75) + 0.5

export {
  linear,
  easeInQuad, easeOutQuad, easeInOutQuad,
  easeInCubic, easeOutCubic, easeInOutCubic,
  easeInQuart, easeOutQuart, easeInOutQuart,
  easeInQuint, easeOutQuint, easeInOutQuint,
  easeInSine, easeOutSine, easeInOutSine,
  easeInExpo, easeOutExpo, easeInOutExpo,
  easeInCirc, easeOutCirc, easeInOutCirc
}
