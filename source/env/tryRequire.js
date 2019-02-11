// TODO: NOTE:
//   will cause webpack warning `Critical dependency: the request of a dependency is an expression`, but whatever
//   put in separate folder here so webpack will not assume whole package is indirectly required
//   - If the module source contains a require that cannot be statically analyzed, the context is the current directory.
//   - In this case a Critical dependencies warning is emitted.
//   check: https://github.com/webpack/webpack/issues/196
//   check: https://github.com/sindresorhus/require-fool-webpack

// for require optional node package, not optional file, so do not use relative path
const tryRequire = (name = '') => {
  try {
    return eval(`require`)(name) // eslint-disable-line no-eval
  } catch (error) { __DEV__ && console.log(`[tryRequire] failed for ${name}`, error) }
}

export { tryRequire }
