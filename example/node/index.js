const { runQuiet } = require('../../output-gitignore/library/node/system/Run')
const { startREPL } = require('../../output-gitignore/library/node/system/REPL')
const { describeSystemStatus } = require('../../output-gitignore/library/node/system/Status')

const main = async () => {
  console.log('== status ======================')
  console.log(describeSystemStatus())

  console.log('== exec ========================')
  const { promise, stdoutBufferPromise } = runQuiet({ command: process.platform === 'win32' ? 'dir' : 'ls -l' })
  await promise
  console.warn((await stdoutBufferPromise).toString())

  console.log('== REPL ========================')
  const replServer = startREPL()
  replServer.context.Dr = 'Dr' // set global
}

main().catch(console.error)
