function getConsoleMethod (name) {
  return console[ name ].bind ? console[ name ].bind(console)
    : console[ name ].apply ? (...args) => console[ name ].apply(console, args)
      : (...args) => console[ name ](args)
}

const log = getConsoleMethod('log')
const warn = getConsoleMethod('warn')
const error = getConsoleMethod('error')
const assert = (assertion, ...args) => {
  if (assertion) return
  error('[ASSERT]', ...args)
  throw new Error(`[ASSERT] ${args.join(', ')}`) // guaranteed Error throw (console.assert in Browser do not throw)
}

export {
  log,
  warn,
  error,
  assert
}
