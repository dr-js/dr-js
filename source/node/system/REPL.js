import nodeModuleRepl from 'repl'
import { global } from 'source/env'

const startREPL = () => nodeModuleRepl.start({
  prompt: '> ',
  input: global.process.stdin,
  output: global.process.stdout,
  useGlobal: true
})

export { startREPL }
