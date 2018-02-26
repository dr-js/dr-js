import { resolve as resolvePath } from 'path'
import { loadFlag, checkFlag, runMain } from 'dev-dep-tool/library/__utils__'
import { getLogger } from 'dev-dep-tool/library/logger'
import { binary, time } from 'source/common/format'
import webpack from 'webpack'

const PATH_ROOT = resolvePath(__dirname, '..')
const PATH_OUTPUT = resolvePath(__dirname, '../output-gitignore')
const fromRoot = (...args) => resolvePath(PATH_ROOT, ...args)
const fromOutput = (...args) => resolvePath(PATH_OUTPUT, ...args)

const BABEL_OPTIONS = {
  babelrc: false,
  presets: [ [ '@babel/env', { targets: { node: 8 }, modules: false } ] ],
  plugins: [ [ '@babel/proposal-class-properties' ], [ '@babel/proposal-object-rest-spread', { useBuiltIns: true } ] ]
}

const compileWithWebpack = async ({ MODE, logger }) => {
  const IS_PRODUCTION = MODE === 'production'

  const compiler = webpack({
    mode: MODE,
    output: { path: fromOutput('library'), filename: '[name].js', library: 'Dr', libraryTarget: 'umd' },
    entry: { 'Dr.browser': 'source/Dr.browser' },
    resolve: { alias: { source: fromRoot('source') } },
    module: { rules: [ { test: /\.js$/, exclude: /node_modules/, use: { loader: 'babel-loader', options: BABEL_OPTIONS } } ] },
    plugins: [ new webpack.DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify(MODE), __DEV__: !IS_PRODUCTION }) ]
  })

  return new Promise((resolve, reject) => compiler.run((error, stats) => {
    if (error) return reject(error)

    stats.hasErrors() && stats.toJson().errors.forEach((message) => console.error(message))
    stats.hasWarnings() && stats.toJson().warnings.forEach((message) => console.warn(message))
    if (stats.hasErrors()) return reject(new Error('webpack stats Error'))

    Object.entries(stats.compilation.assets).forEach(([ name, sourceInfo ]) => {
      logger.log(`output: ${name} [${binary(sourceInfo.size())}B] emitted: ${sourceInfo.emitted}`)
    })
    logger.log(`time: ${time(stats.endTime - stats.startTime)}`)

    resolve(stats)
  }))
}

runMain(async (logger) => {
  const MODE = checkFlag(loadFlag([ 'development', 'production' ]), [ 'development', 'production' ], 'production')

  logger.padLog(`compile with webpack mode: ${MODE}`)
  await compileWithWebpack({ MODE, logger })
}, getLogger(`webpack`))
