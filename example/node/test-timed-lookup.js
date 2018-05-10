const { generateCheckCode, verifyCheckCode } = require('../../output-gitignore/library/common/module/TimedLookup')
const { generateLookupData, saveLookupFile, loadLookupFile } = require('../../output-gitignore/library/node/module/TimedLookup')

const FILE_TIMED_LOOKUP = `${__dirname}/test-timed-lookup-gitignore.key`

const main = async () => {
  let lookupData
  try {
    lookupData = await loadLookupFile(FILE_TIMED_LOOKUP)
    console.log('loaded lookup table')
  } catch (error) {
    console.log('new lookup table', error)
    lookupData = await generateLookupData({ tokenSize: 10, timeGap: 2 })
    await saveLookupFile(FILE_TIMED_LOOKUP, lookupData)
  }

  console.log(generateCheckCode(lookupData, Date.now() * 0.001))
  console.log(generateCheckCode(lookupData, Date.now() * 0.001))
  console.log(generateCheckCode(lookupData, Date.now() * 0.001))

  const checkCode = generateCheckCode(lookupData, Date.now() * 0.001 - 0.5)
  verifyCheckCode(lookupData, checkCode, Date.now() * 0.001)
}

main().catch(console.error)
