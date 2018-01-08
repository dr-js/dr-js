const nodeModulePath = require('path')
const webpack = require('webpack')
const BabelMinifyPlugin = require('babel-minify-webpack-plugin')
const { DefinePlugin, BannerPlugin, optimize: { ModuleConcatenationPlugin } } = webpack

const NODE_ENV = process.env.NODE_ENV
const IS_PRODUCTION = NODE_ENV === 'production'

const BABEL_OPTIONS = {
  babelrc: false,
  presets: [ [ 'env', { targets: { node: 8 }, modules: false } ] ],
  plugins: [ [ 'transform-class-properties' ], [ 'transform-object-rest-spread', { useBuiltIns: true } ] ]
}

module.exports = {
  output: {
    path: nodeModulePath.join(__dirname, './output-gitignore/library/'),
    filename: '[name].js',
    library: 'Dr',
    libraryTarget: 'umd'
  },
  entry: { // why Array? check: https://github.com/webpack/webpack/issues/300
    'Dr.browser': [ 'source/Dr.browser' ]
  },
  resolve: { alias: { source: nodeModulePath.resolve(__dirname, './source/') } },
  target: 'node', // support node main modules like 'fs'
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, use: { loader: 'babel-loader', options: BABEL_OPTIONS } }
    ]
  },
  plugins: [
    new DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify(NODE_ENV), '__DEV__': !IS_PRODUCTION }),
    ...(IS_PRODUCTION ? [
      new ModuleConcatenationPlugin(),
      new BabelMinifyPlugin(),
      new BannerPlugin({ banner: '/* eslint-disable */', raw: true, test: /\.js$/, entryOnly: false })
    ] : [])
  ]
}
