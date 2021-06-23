import { runMain } from '@dr-js/dev/module/main.js'
import { guardPromiseEarlyExit } from '../ExitListener.js'

runMain(async () => {
  const promiseBroken = new Promise(() => {})

  console.log('test guard hit, should exit with code 42')
  await guardPromiseEarlyExit(() => {
    console.log('guard hit, should exit with code 42')
    process.exitCode = 42
  }, promiseBroken)

  console.log('should not pass guard')
  process.exitCode = 255
})
