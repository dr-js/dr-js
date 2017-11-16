const Dr = require('../Dr.node')

// console.log(Object.keys(Dr))
// console.log(Object.keys(Dr.Node))

const { System: { startREPL }, Module: { runCommand } } = Dr.Node

const main = async () => {
  console.log(await runCommand(process.platform === 'win32' ? 'dir' : 'ls -l'))
  console.log('== REPL ========================')
  const replServer = startREPL()
  replServer.context.Dr = Dr // set global
}

main().catch(console.error)
