import { strictEqual } from 'assert'
import { runMain } from '@dr-js/dev/module/main'
import { guardPromiseEarlyExit } from '../ExitListener'

runMain(async () => {
  const promisePass = new Promise((resolve, reject) => setTimeout(resolve, 5))
  await guardPromiseEarlyExit(() => {
    console.log('should not trigger guard')
    process.exitCode = 255
  }, promisePass)

  const FAIL_ERROR = {}
  const promiseFail = new Promise((resolve, reject) => setTimeout(() => reject(FAIL_ERROR), 5))
  await guardPromiseEarlyExit(() => {
    console.log('should not trigger guard')
    process.exitCode = 254
  }, promiseFail)
    .then(
      (result) => {
        console.log('should not resolve with:', result)
        process.exitCode = 253
      },
      (error) => strictEqual(error, FAIL_ERROR)
    )
})
