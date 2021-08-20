import { runKit } from 'source/node/kit.js'
import { guardPromiseEarlyExit } from '../ExitListener.js'

runKit(async (kit) => {
  const promiseBroken = new Promise(() => {})

  kit.log('test guard hit, should exit with code 42')
  await guardPromiseEarlyExit(() => {
    kit.log('guard hit, should exit with code 42')
    process.exitCode = 42
  }, promiseBroken)

  kit.log('should not pass guard')
  process.exitCode = 255
})
