const { exec } = require('../../output-gitignore/library/node/module/Command')
const { startREPL } = require('../../output-gitignore/library/node/system/REPL')

const main = async () => {
  console.log('== exec ========================')
  const { stdout } = await exec(process.platform === 'win32' ? 'dir' : 'ls -l')
  console.warn(stdout)

  console.log('== REPL ========================')
  const replServer = startREPL()
  replServer.context.Dr = 'Dr' // set global
}

main().catch(console.error)
