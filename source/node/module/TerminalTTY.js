import { createInterface } from 'readline'
import { throttle } from 'source/common/function.js'

// AES = ANSI escape code
// https://en.wikipedia.org/wiki/ANSI_escape_code
// http://jafrog.com/2013/11/23/colors-in-terminal.html
// https://misc.flogisoft.com/bash/tip_colors_and_formatting

// name|Foreground|Background
const AES_DEFAULT_FG = 39
const AES_DEFAULT_BG = 49
const AES_CONFIG_TEXT = `
black|30|40
red|31|41
green|32|42
yellow|33|43
blue|34|44
magenta|35|45
cyan|36|46
lightGray|37|47

default|${AES_DEFAULT_FG}|${AES_DEFAULT_BG}

darkGray|90|100
lightRed|91|101
lightGreen|92|102
lightYellow|93|103
lightBlue|94|104
lightMagenta|95|105
lightCyan|96|106
white|97|107
`

// usage:
//   const Color = createColor()
//   console.log(Color.fg.red(string))
const createColor = ({
  isEnableColor = (
    (process.stdout.isTTY && process.stdout.hasColors()) || // very simplified, check: https://github.com/chalk/supports-color/blob/master/index.js
    process.env.CI // for GitHub Actions, the `process.stdout` is not a `tty.WriteStream`
  )
} = {}) => {
  const toAES = (value) => `\x1b[${value}m`
  const createWrapper = isEnableColor
    ? (setAES, clearAES) => (text) => `${setAES}${text}${clearAES}` // TODO: no nesting support
    : () => (text) => text

  const wrapperFg = {}
  const wrapperBg = {}
  AES_CONFIG_TEXT.split('\n').filter(Boolean).forEach((controlSequenceText) => {
    const [ name, colorFg, colorBg ] = controlSequenceText.split('|')
    wrapperFg[ name ] = createWrapper(toAES(colorFg), toAES(AES_DEFAULT_FG))
    wrapperBg[ name ] = createWrapper(toAES(colorBg), toAES(AES_DEFAULT_BG))
  })

  return {
    fg: wrapperFg,
    bg: wrapperBg
  }
}

const createStatusBar = ({
  stream = process.stdout,
  throttleWait = 200, // in msec
  trimOverflow = true // disable if the text contains color code
} = {}) => {
  if (!stream.isTTY) return { update: () => {}, done: () => {} }

  let isDone = false
  let nextText = ''
  let prevText = ''

  const tickFunc = () => {
    if (isDone || nextText === prevText) return
    stream.clearLine(0)
    stream.cursorTo(0)
    stream.write(trimOverflow
      ? nextText.slice(0, stream.columns)
      : nextText
    )
    prevText = nextText
  }

  const tick = throttleWait
    ? throttle(tickFunc, throttleWait)
    : tickFunc

  const update = (text) => {
    nextText = text
    tick()
  }
  const done = () => {
    isDone = true
    stream.clearLine(0)
    stream.cursorTo(0)
  }

  return { update, done }
}

export {
  createColor,
  createStatusBar
}
