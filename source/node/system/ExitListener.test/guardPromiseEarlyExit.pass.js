import { strictEqual } from 'node:assert'
import { runKit } from 'source/node/kit.js'
import { guardPromiseEarlyExit } from '../ExitListener.js'

runKit(async (kit) => {
  const promisePass = new Promise((resolve, reject) => setTimeout(resolve, 5))
  await guardPromiseEarlyExit(() => {
    kit.log('should not trigger guard')
    process.exitCode = 255
  }, promisePass)

  const FAIL_ERROR = {}
  const promiseFail = new Promise((resolve, reject) => setTimeout(() => reject(FAIL_ERROR), 5))
  await guardPromiseEarlyExit(() => {
    kit.log('should not trigger guard')
    process.exitCode = 254
  }, promiseFail)
    .then(
      (result) => {
        kit.log('should not resolve with:', result)
        process.exitCode = 253
      },
      (error) => strictEqual(error, FAIL_ERROR)
    )
})
