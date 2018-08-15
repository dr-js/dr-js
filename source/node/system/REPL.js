import { start } from 'repl'

const startREPL = () => start({ // TODO: DEPRECATE: moved to bin
  prompt: '> ',
  input: process.stdin,
  output: process.stdout,
  useGlobal: true
})

export { startREPL } // TODO: DEPRECATE: moved to bin
