const { getBabelConfig } = require('dr-dev/library/babel')

const BABEL_ENV = process.env.BABEL_ENV || ''
const isUseSource = BABEL_ENV.includes('use-source')

module.exports = getBabelConfig({
  extraModuleResolverList: [ {
    '^@dr-js/core/module/(.+)': isUseSource
      ? './source/\\1' // when direct use/test `./source-bin` with `@babel/register`
      : './library/\\1' // when build to output
  } ]
})
