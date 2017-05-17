const nodeModulePath = require('path')
const config = require('./common.conf')

module.exports = Object.assign(config, {
  output: {
    path: nodeModulePath.join(__dirname, '../example/'),
    filename: '[name].js',
    library: 'Dr',
    libraryTarget: 'umd'
  }
})
