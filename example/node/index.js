const { runQuiet } = require('../../output-gitignore/library/node/system/Run')
const { startREPL } = require('../../output-gitignore/library/node/system/REPL')

const main = async () => {
  console.log('== exec ========================')
  const { stdoutBufferPromise } = await runQuiet({ command: process.platform === 'win32' ? 'dir' : 'ls -l' })
  console.warn((await stdoutBufferPromise).toString())

  console.log('== REPL ========================')
  const replServer = startREPL()
  replServer.context.Dr = 'Dr' // set global
}

main().catch(console.error)
