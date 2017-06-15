const nodeModulePath = require('path')
const webpack = require('webpack')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const { DefinePlugin, BannerPlugin } = webpack

const NODE_ENV = process.env.NODE_ENV
const PRODUCTION = NODE_ENV === 'production'

module.exports = {
  // output: {},
  entry: { // why Array? check: https://github.com/webpack/webpack/issues/300
    'Dr': [ nodeModulePath.join(__dirname, '../source/Dr') ],
    'Dr.node': [ nodeModulePath.join(__dirname, '../source/Dr.node') ],
    'Dr.browser': [ nodeModulePath.join(__dirname, '../source/Dr.browser') ]
  },
  target: 'node', // support node main modules like 'fs'
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: false,
            presets: PRODUCTION ? [ 'es2015', 'stage-0' ] : [ [ 'env', { targets: { node: 'current' } } ] ],
            plugins: [
              'transform-object-rest-spread',
              'transform-class-properties',
              [ 'transform-runtime', { helpers: true, polyfill: false, regenerator: false, moduleName: 'babel-runtime' } ]
            ]
          }
        }
      }
    ]
  },
  resolve: {
    alias: { source: nodeModulePath.resolve(__dirname, '../source') }
  },
  plugins: [].concat(
    new DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify(NODE_ENV), '__DEV__': !PRODUCTION }),
    PRODUCTION ? [
      new UglifyJSPlugin({
        beautify: true,
        mangle: false,
        compress: {
          sequences: false,       // join consecutive statements with the “comma operator”
          properties: true,       // optimize property access: a["foo"] → a.foo
          dead_code: true,        // discard unreachable code
          drop_debugger: false,   // discard “debugger” statements
          unsafe: false,          // some unsafe optimizations (see below)
          conditionals: true,     // optimize if-s and conditional expressions
          comparisons: true,      // optimize comparisons
          evaluate: true,         // evaluate constant expressions
          booleans: true,         // optimize boolean expressions
          loops: true,            // optimize loops
          unused: true,           // drop unused variables/functions
          hoist_funs: false,      // hoist function declarations
          hoist_vars: false,      // hoist variable declarations
          if_return: true,        // optimize if-s followed by return/continue
          join_vars: false,       // join var declarations
          cascade: false,         // try to cascade `right` into `left` in sequences
          side_effects: true,     // drop side-effect-free statements
          warnings: true,         // warn about potentially dangerous optimizations/code
          global_defs: {}         // global definitions
        }
      }),
      new BannerPlugin({ banner: '/* eslint-disable */', raw: true, test: /\.js$/, entryOnly: false }),
    ] : []
  )
}
