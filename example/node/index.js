const { run } = require('../../output-gitignore/library/node/system/Run')
const { describeSystemStatus } = require('../../output-gitignore/library/node/system/Status')

const main = async () => {
  console.log('== status ======================')
  console.log(describeSystemStatus())

  console.log('== exec ========================')
  const [ command, ...argList ] = (process.platform === 'win32' ? 'CMD.exe /S /C dir' : 'ls -l').split(' ')
  const { promise, stdoutPromise } = run({ command, argList, quiet: true })
  await promise
  console.warn(String(await stdoutPromise))
}

main().catch(console.error)
