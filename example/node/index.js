const { describeRunOutcome, run } = require('../../output-gitignore/library/node/run.js')
const { describeSystemStatus } = require('../../output-gitignore/library/node/system/Status.js')

const main = async () => {
  console.log('== status ======================')
  console.log(describeSystemStatus())

  console.log('== exec ========================')
  const argList = (process.platform === 'win32' ? 'CMD.exe /S /C dir' : 'ls -l').split(' ')
  console.log(await describeRunOutcome(await run(argList, { quiet: true }).promise))
}

main().catch(console.error)
