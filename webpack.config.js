module.exports = {
  entry: {
    'Dr.js': './Dr.js',
    // 'Dr.browser.js': './Dr.browser.js',
    'Dr.node.js': './Dr.node.js'
  },
  output: {
    path: './distribute',
    filename: '[name]'
  },
  module: {
    loaders: [ {
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader'
    } ]
  },
  target: 'node' // support node main mudules like 'fs'
}
