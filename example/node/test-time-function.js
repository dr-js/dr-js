const {
  linear,
  easeInQuad, easeOutQuad, easeInOutQuad,
  easeInCubic, easeOutCubic, easeInOutCubic,
  easeInQuart, easeOutQuart, easeInOutQuart,
  easeInQuint, easeOutQuint, easeInOutQuint,
  easeInSine, easeOutSine, easeInOutSine,
  easeInExpo, easeOutExpo, easeInOutExpo,
  easeInCirc, easeOutCirc, easeInOutCirc
} = require('../../output-gitignore/library/common/math/easing')
const { getSampleRate } = require('../../output-gitignore/library/common/math/sample')
const { getBlockChart } = require('../../output-gitignore/library/common/module/BlockChart')

const SAMPLE_LIST = getSampleRate(40)
const testChart = (name, func) => console.log(`[${name}]\n|${getBlockChart({ valueList: SAMPLE_LIST.map(func), width: 80 }).join('\n|')}`)

testChart('linear', linear)
testChart('easeInQuad', easeInQuad)
testChart('easeInCubic', easeInCubic)
testChart('easeInQuart', easeInQuart)
testChart('easeInQuint', easeInQuint)
testChart('easeInSine', easeInSine)
testChart('easeInExpo', easeInExpo)
testChart('easeInCirc', easeInCirc)
testChart('easeOutQuad', easeOutQuad)
testChart('easeOutCubic', easeOutCubic)
testChart('easeOutQuart', easeOutQuart)
testChart('easeOutQuint', easeOutQuint)
testChart('easeOutSine', easeOutSine)
testChart('easeOutExpo', easeOutExpo)
testChart('easeOutCirc', easeOutCirc)
testChart('easeInOutQuad', easeInOutQuad)
testChart('easeInOutCubic', easeInOutCubic)
testChart('easeInOutQuart', easeInOutQuart)
testChart('easeInOutQuint', easeInOutQuint)
testChart('easeInOutSine', easeInOutSine)
testChart('easeInOutExpo', easeInOutExpo)
testChart('easeInOutCirc', easeInOutCirc)