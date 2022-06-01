const { resolve } = require('node:path')
const { readArrayBuffer, writeArrayBuffer } = require('../../output-gitignore/library/node/fs/File.js')
const {
  generateLookupData,
  generateCheckCode,
  verifyCheckCode,
  packDataArrayBuffer,
  parseDataArrayBuffer
} = require('../../output-gitignore/library/common/module/TimedLookup.js')

const FILE_TIMED_LOOKUP = resolve(__dirname, 'test-timed-lookup-gitignore.key')

const main = async () => {
  let lookupData
  try {
    lookupData = parseDataArrayBuffer(await readArrayBuffer(FILE_TIMED_LOOKUP))
    console.log('loaded lookup table')
  } catch (error) {
    console.log('new lookup table', error)
    lookupData = generateLookupData({ tokenSize: 10, timeGap: 2 })
    await writeArrayBuffer(FILE_TIMED_LOOKUP, packDataArrayBuffer(lookupData))
  }

  console.log(' ', generateCheckCode(lookupData, Date.now() + 1000))
  console.log(' ', generateCheckCode(lookupData, Date.now() + 100))
  console.log(' ', generateCheckCode(lookupData, Date.now() + 10))
  console.log(' ', generateCheckCode(lookupData, Date.now() + 1))
  console.log('>', generateCheckCode(lookupData, Date.now()))
  console.log(' ', generateCheckCode(lookupData, Date.now() - 1))
  console.log(' ', generateCheckCode(lookupData, Date.now() - 10))
  console.log(' ', generateCheckCode(lookupData, Date.now() - 100))
  console.log(' ', generateCheckCode(lookupData, Date.now() - 1000))

  const checkCode = generateCheckCode(lookupData, Date.now() * 0.001 - 0.5)
  verifyCheckCode(lookupData, checkCode, Date.now() * 0.001)
}

main().catch(console.error)
