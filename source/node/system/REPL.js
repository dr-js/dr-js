import nodeModuleRepl from 'repl'

const startREPL = () => nodeModuleRepl.start({
  prompt: '> ',
  input: process.stdin,
  output: process.stdout,
  useGlobal: true
})

export { startREPL }
