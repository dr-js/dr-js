const { getBabelConfig } = require('@dr-js/dev/library/babel.js')

const BABEL_ENV = process.env.BABEL_ENV || ''
const isOutputBin = BABEL_ENV.includes('outputBin') // map `source/*` to `../library/*` for `source-bin` in output

module.exports = getBabelConfig({
  extraModuleResolverList: isOutputBin ? [ { '^source/(.+)': './library/\\1' } ] : undefined
})
