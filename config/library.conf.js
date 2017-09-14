const nodeModulePath = require('path')
const config = require('./common.conf')

module.exports = {
  ...config,
  output: {
    path: nodeModulePath.join(__dirname, '../library/'),
    filename: '[name].js',
    library: 'Dr',
    libraryTarget: 'umd'
  }
}
