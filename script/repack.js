const nodeModuleFs = require('fs')
const nodeModulePath = require('path')
const nodeModuleChildProcess = require('child_process')
const { Verify } = require('dr-js/library/common')
const { createDirectory, modify } = require('dr-js/library/node/file')

const PATH_ROOT = nodeModulePath.resolve(__dirname, '..')
const fromRoot = (...args) => nodeModulePath.resolve(PATH_ROOT, ...args)
const fromOutput = (...args) => nodeModulePath.resolve(PATH_ROOT, 'output-gitignore', ...args)

const getLogger = (title) => {
  const log = (...args) => console.log(`- ${args.join(' ')}`)

  const padTitle = ` [${title}]`
  const padLog = (...args) => console.log(`## ${args.join(' ')} `.padEnd(160 - padTitle.length, '-') + padTitle)

  return { log, padLog }
}

const DEFAULT_EXEC_OPTION = { stdio: [ process.stdin, process.stdout, process.stderr ], shell: true }

const main = async () => {
  const { log, padLog } = getLogger('repack')

  const [ , , MODE = 'pack-only' ] = process.argv

  Verify.oneOf(MODE, [ 'pack-only', 'publish', 'publish-dev' ])

  log(`MODE: ${MODE}`)

  const execOptionRoot = { ...DEFAULT_EXEC_OPTION, cwd: fromRoot() }
  const execOptionOutput = { ...DEFAULT_EXEC_OPTION, cwd: fromOutput() }

  padLog('test')
  nodeModuleChildProcess.execSync('npm run test', execOptionRoot)

  padLog('build')
  nodeModuleChildProcess.execSync('npm run build', execOptionRoot)

  await createDirectory(fromOutput())

  padLog(`create ${fromOutput('package.json')}`)
  const packageJSON = require('../package.json')
  delete packageJSON.scripts
  delete packageJSON.engines
  delete packageJSON.devDependencies
  nodeModuleFs.writeFileSync(fromOutput('package.json'), JSON.stringify(packageJSON))

  padLog(`copy LICENSE, README.md`)
  await modify.copy(fromRoot('LICENSE'), fromOutput('LICENSE'))
  await modify.copy(fromRoot('README.md'), fromOutput('README.md'))

  if (MODE === 'pack-only') {
    padLog(`pack`)
    nodeModuleChildProcess.execSync('npm pack', execOptionOutput)
    const outputFileName = `${packageJSON.name}-${packageJSON.version}.tgz`
    await modify.move(fromOutput(outputFileName), fromRoot(outputFileName))
    padLog(`pack finished: ${fromRoot(outputFileName)}`)
  } else if (MODE === 'publish') {
    padLog(`publish`)
    nodeModuleChildProcess.execSync('npm publish', execOptionOutput)
  } else if (MODE === 'publish-dev') {
    padLog(`publish-dev`)
    nodeModuleChildProcess.execSync('npm publish --tag dev', execOptionOutput)
  }
  padLog(`done`)
}

main().catch((error) => {
  console.warn(error)
  process.exit(-1)
})
