const Dr = require('../Dr.node')

// console.log(Object.keys(Dr))
// console.log(Object.keys(Dr.Node))

const { runCommand } = Dr.Node.Module

runCommand(process.platform === 'win32' ? 'dir' : 'ls -l')
  .then(console.log, console.error)

const replServer = Dr.Node.System.startREPL()
replServer.context.Dr = Dr // set global
