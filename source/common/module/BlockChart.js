import { clamp } from 'source/common/math/base.js'

const BLOCK_CHAR_LIST = [ '', '▏', '▎', '▍', '▋', '▊', '▉' ]

const getBlockChar = (rate) => BLOCK_CHAR_LIST[ Math.floor(clamp(rate, 0, 1) * (BLOCK_CHAR_LIST.length - 1)) ]

const getBlockBar = (value) => {
  let result = ''
  while (value > 0) {
    result += getBlockChar(value)
    value -= 1
  }
  return result
}

const getBlockChart = ({
  valueList = [],
  valueMax = valueList.reduce((o, v) => Math.max(o, v), -Infinity),
  valueMin = valueList.reduce((o, v) => Math.min(o, v), Infinity),
  width = 20
}) => valueList.map((value) => getBlockBar(clamp(value, valueMin, valueMax) / (valueMax - valueMin) * (width)))

export { getBlockBar, getBlockChart }
