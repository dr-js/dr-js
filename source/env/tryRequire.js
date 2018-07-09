// TODO: will cause webpack warning `Critical dependency: the request of a dependency is an expression`, but whatever
// TODO: put in separate folder here so webpack will not assume whole package is required
// - - If the module source contains a require that cannot be statically analyzed, the context is the current directory.
// - - In this case a Critical dependencies warning is emitted.
const tryRequire = (name = '') => {
  try {
    return require(name)
  } catch (error) { __DEV__ && console.log(`[TRY_REQUIRE] failed for ${name}`, error) }
}

export { tryRequire }
