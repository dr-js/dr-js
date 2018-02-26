const getReplaceDEV = (value) => ({ replacements: [ { identifierName: '__DEV__', replacement: { type: 'booleanLiteral', value } } ] })

module.exports = {
  env: {
    dev: { // __DEV__ = true, use require()
      presets: [ [ '@babel/env', { targets: { node: 8 } } ] ],
      plugins: [
        [ '@babel/proposal-class-properties' ],
        [ '@babel/proposal-object-rest-spread', { useBuiltIns: true } ],
        [ 'module-resolver', { root: [ './' ], alias: { 'dr-js/module/(.+)': './library/' } } ],
        [ 'minify-replace', getReplaceDEV(true) ]
      ]
    },
    test: { // __DEV__ = false, use require()
      presets: [ [ '@babel/env', { targets: { node: 8 } } ] ],
      plugins: [
        [ '@babel/proposal-class-properties' ],
        [ '@babel/proposal-object-rest-spread', { useBuiltIns: true } ],
        [ 'module-resolver', { root: [ './' ] } ],
        [ 'minify-replace', getReplaceDEV(false) ]
      ]
    },
    library: { // __DEV__ = false, use require(), simplify
      presets: [ [ '@babel/env', { targets: { node: 8 } } ] ],
      plugins: [
        [ '@babel/proposal-class-properties' ],
        [ '@babel/proposal-object-rest-spread', { useBuiltIns: true } ],
        [ 'module-resolver', { root: [ './' ], alias: { 'dr-js/module/(.+)': './library/' } } ],
        [ 'minify-replace', getReplaceDEV(false) ],
        [ 'minify-guarded-expressions' ],
        [ 'minify-dead-code-elimination' ]
      ],
      comments: false
    },
    module: { // __DEV__ = false, use import from, remove unused code & comment
      presets: [ [ '@babel/env', { targets: { node: 8 }, modules: false } ] ],
      plugins: [
        [ '@babel/proposal-class-properties' ],
        [ '@babel/proposal-object-rest-spread', { useBuiltIns: true } ],
        [ 'module-resolver', { root: [ './' ] } ],
        [ 'minify-replace', getReplaceDEV(false) ],
        [ 'minify-guarded-expressions' ],
        [ 'minify-dead-code-elimination' ]
      ],
      comments: false
    }
  }
}
