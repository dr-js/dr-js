const Dr = require('../Dr.node')

const { System: { startREPL }, Module: { runCommand } } = Dr.Node

const main = async () => {
  console.log(await runCommand(process.platform === 'win32' ? 'dir' : 'ls -l'))
  console.log('== REPL ========================')
  const replServer = startREPL()
  replServer.context.Dr = Dr // set global
}

main().catch(console.error)
