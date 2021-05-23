const { resolve } = require('path')
const { readFileSync, writeFileSync } = require('fs')
const { toArrayBuffer } = require('../../output-gitignore/library/node/data/Buffer')
const {
  generateLookupData,
  generateCheckCode,
  verifyCheckCode,
  packDataArrayBuffer,
  parseDataArrayBuffer
} = require('../../output-gitignore/library/common/module/TimedLookup')

const FILE_TIMED_LOOKUP = resolve(__dirname, 'test-timed-lookup-gitignore.key')

const main = async () => {
  let lookupData
  try {
    lookupData = parseDataArrayBuffer(toArrayBuffer(readFileSync(FILE_TIMED_LOOKUP)))
    console.log('loaded lookup table')
  } catch (error) {
    console.log('new lookup table', error)
    lookupData = generateLookupData({ tokenSize: 10, timeGap: 2 })
    writeFileSync(FILE_TIMED_LOOKUP, Buffer.from(packDataArrayBuffer(lookupData)))
  }

  console.log(generateCheckCode(lookupData, Date.now() * 0.001))
  console.log(generateCheckCode(lookupData, Date.now() * 0.001))
  console.log(generateCheckCode(lookupData, Date.now() * 0.001))

  const checkCode = generateCheckCode(lookupData, Date.now() * 0.001 - 0.5)
  verifyCheckCode(lookupData, checkCode, Date.now() * 0.001)
}

main().catch(console.error)
