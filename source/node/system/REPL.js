import { start } from 'repl'

const startREPL = () => start({
  prompt: '> ',
  input: process.stdin,
  output: process.stdout,
  useGlobal: true
})

export { startREPL }
