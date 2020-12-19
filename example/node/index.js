const { describeRunOutcome, run } = require('../../output-gitignore/library/node/system/Run')
const { describeSystemStatus } = require('../../output-gitignore/library/node/system/Status')

const main = async () => {
  console.log('== status ======================')
  console.log(describeSystemStatus())

  console.log('== exec ========================')
  const [ command, ...argList ] = (process.platform === 'win32' ? 'CMD.exe /S /C dir' : 'ls -l').split(' ')
  console.log(await describeRunOutcome(await run({ command, argList, quiet: true }).promise))
}

main().catch(console.error)
