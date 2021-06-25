import { throttle } from 'source/common/function.js'

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

export { createStatusBar }
