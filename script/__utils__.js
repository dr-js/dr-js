import { resolve } from 'path'
import { statSync, readFileSync, writeFileSync } from 'fs'

import { binary as formatBinary } from 'source/common/format'

const PATH_ROOT = resolve(__dirname, '..')
const PATH_OUTPUT = resolve(__dirname, '../output-gitignore')
const fromRoot = (...args) => resolve(PATH_ROOT, ...args)
const fromOutput = (...args) => resolve(PATH_OUTPUT, ...args)

const getLogger = (title) => ({
  log: (...args) => console.log(`- ${args.join(' ')}`),
  padLog: (...args) => console.log(`## ${args.join(' ')} `.padEnd(160 - title.length, '-') + title)
})

const wrapFileProcessor = (processor, log) => async (filePath) => {
  const inputString = readFileSync(filePath, 'utf8')
  const outputString = await processor(inputString, filePath)
  if (inputString === outputString) {
    log(`process skipped ${filePath}`)
    return 0 // size reduce
  }
  const { size: inputSize } = statSync(filePath)
  writeFileSync(filePath, outputString)
  const { size: outputSize } = statSync(filePath)
  log(
    `process`,
    `[${(outputSize / inputSize).toFixed(2)}-${formatBinary(inputSize - outputSize)}B]`,
    `${formatBinary(inputSize)}B => ${formatBinary(outputSize)}B`,
    `| ${filePath}`
  )
  return inputSize - outputSize
}

export {
  fromRoot,
  fromOutput,
  getLogger,
  wrapFileProcessor
}
