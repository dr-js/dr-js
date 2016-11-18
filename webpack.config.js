module.exports = {
  entry: { // why Array? check: https://github.com/webpack/webpack/issues/300
    'Dr.js': [ './source/Dr.js' ],
    // 'Dr.browser.js': [ './source/Dr.browser.js' ],
    'Dr.node.js': [ './source/Dr.node.js' ]
  },
  output: {
    path: '.',
    filename: '[name]'
  },
  module: {
    loaders: [ {
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader'
    } ]
  },
  target: 'node' // support node main modules like 'fs'
}
