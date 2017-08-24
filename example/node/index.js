const Dr = require('../Dr.node')

console.log(Object.keys(Dr))
console.log(Object.keys(Dr.Node))

const { runCommand } = Dr.Node.Module

runCommand('dir /w').then(console.log)

// const replServer = Dr.Node.System.startREPL()
// Object.defineProperty(
//   replServer.context,
//   'Dr',
//   { configurable: false, enumerable: true, value: Dr }
// )
