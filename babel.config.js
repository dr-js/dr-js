const BABEL_ENV = process.env.BABEL_ENV || ''
const isDev = BABEL_ENV.includes('dev')
const isModule = BABEL_ENV.includes('module')
const isUseSource = BABEL_ENV.includes('use-source')

module.exports = {
  presets: [
    [ '@babel/env', { targets: { node: '10' }, modules: isModule ? false : 'commonjs' } ]
  ],
  plugins: [
    !isModule && [ '@babel/proposal-object-rest-spread', { loose: true, useBuiltIns: true } ], // NOTE: for Edge(17.17134) support check: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax#Spread_in_object_literals
    [ 'minify-replace', { replacements: [ { identifierName: '__DEV__', replacement: { type: 'booleanLiteral', value: isDev } } ] } ],
    [ 'module-resolver', {
      root: [ './' ],
      alias: isModule ? undefined : [ {
        '^dr-js/module/(.+)': isUseSource
          ? './source/\\1' // when direct use/test `./source-bin` with `babel-node`
          : './library/\\1' // when build to output
      }, { '^dr-([\\w-]+)/module/(.+)': 'dr-\\1/library/\\2' } ]
    } ]
  ].filter(Boolean),
  comments: false
}
