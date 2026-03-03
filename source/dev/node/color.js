import { createColor } from 'source/node/module/TerminalTTY.js'

const { // add expand to allow IDE to pickup key list
  default: defaultColor,
  black, red, green, yellow, blue, magenta, cyan, lightGray,
  darkGray, lightRed, lightGreen, lightYellow, lightBlue, lightMagenta, lightCyan, white
} = createColor().fg

const color = {
  default: defaultColor,
  black, red, green, yellow, blue, magenta, cyan, lightGray,
  darkGray, lightRed, lightGreen, lightYellow, lightBlue, lightMagenta, lightCyan, white
}

export { color }
