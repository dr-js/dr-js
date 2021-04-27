import { withTempDirectory } from '@dr-js/dev/module/node/file.js'
import { run } from 'source/node/run.js'

const { info = console.log } = global

const PATH_TEMP = `${__dirname}/temp-gitignore`

const runFuncWithExposeGC = async (...funcList) => withTempDirectory(
  PATH_TEMP,
  async () => run([
    process.execPath,
    '--expose-gc', // allow `global.gc()` call
    '--max-old-space-size=32', // limit max memory usage for faster OOM
    '--eval', `(${funcList.reduce((o, func) => `(${func})(global.gc, ${o})`, 'undefined')})`
  ], {
    maxBuffer: 8 * 1024 * 1024,
    cwd: PATH_TEMP, // generate OOM report under temp path
    quiet: !__DEV__
  }).promise.catch((error) => error)
)

const createTestFunc = (expectExitCode = 0, ...funcList) => async () => {
  const { code, signal, stdoutPromise, stderrPromise } = await runFuncWithExposeGC(...funcList)
  !__DEV__ && info(`STDOUT:\n${await stdoutPromise}\n\nSTDERR:\n${await stderrPromise}`)
  info(`test done, exit code: ${code}, signal: ${signal}`)
  if (code === expectExitCode) return
  info(`STDOUT:\n${await stdoutPromise}\n\nSTDERR:\n${await stderrPromise}`)
  throw new Error(`exitCode: ${code}, expectExitCode: ${expectExitCode}`)
}

const commonFunc = (triggerGC) => {
  const setTimeoutAsync = (wait = 0) => new Promise((resolve) => setTimeout(resolve, wait))

  const formatMemory = (value) => `${String(value).padStart(10, ' ')}B`

  const markMemory = async () => {
    triggerGC()
    await setTimeoutAsync(10)
    triggerGC()
    const { heapUsed, heapTotal, rss, external } = process.memoryUsage()
    __DEV__ && console.log([
      `heapUsed:  ${formatMemory(heapUsed)}`,
      `heapTotal: ${formatMemory(heapTotal)}`,
      `rss:       ${formatMemory(rss)}`,
      `external:  ${formatMemory(external)}`
    ].join(' '))
    return heapUsed // For the test we only care pure JS Object size
  }

  const appendPromiseAdder = (promise, count = 0) => {
    let index = 0
    while (index++ !== count) promise = promise.then((result) => (result + 1))
    return promise
  }

  const dropOutstandingValue = (valueList, dropCount) => {
    valueList = [ ...valueList ]
    while (dropCount !== 0) {
      dropCount--
      let min = Infinity
      let minIndex = 0
      let max = -Infinity
      let maxIndex = 0
      let sum = 0
      valueList.forEach((value, index) => {
        if (value < min) [ min, minIndex ] = [ value, index ]
        if (value > max) [ max, maxIndex ] = [ value, index ]
        sum += value
      })
      const avg = sum / valueList.length
      const dropIndex = (Math.abs(avg - min) > Math.abs(avg - max)) ? minIndex : maxIndex
      valueList.splice(dropIndex, 1)
    }
    return valueList
  }

  const verifyPrediction = (prediction = '0±0', value = 0, message) => {
    if (prediction === 'SKIP') return
    const [ valueExpect, valueOffset ] = prediction.split('±').map(Number)
    if (Math.abs(value - valueExpect) > valueOffset) throw new Error(`${message || 'prediction failed'}: expect ${prediction}, but get ${value}`)
  }

  const runSubjectPredictionTest = async ({
    testKeepRound, testDropRound, testSubjectCount,
    title, predictionAvg, funcCreateSubject
  }) => {
    console.log(`[TEST] ${title} `.padEnd(64, '='))

    // setup
    const resultList = []

    let testRound = 0
    while (testRound !== (testKeepRound + testDropRound)) { // pre-fill resultList
      resultList[ testRound ] = 0
      testRound++
    }

    testRound = 0
    while (testRound !== (testKeepRound + testDropRound)) {
      // console.log(`  #${testRound}`)

      const subjectList = []
      subjectList.length = testSubjectCount // sort of pre-fill subjectList

      const heapUsedBefore = await markMemory(`    [BEFORE] subjectList: ${subjectList.length}`)

      // fill subject
      let index = 0
      while (index !== testSubjectCount) {
        subjectList[ index ] = await funcCreateSubject(index)
        index++
      }

      const heapUsedAfter = await markMemory(`    [AFTER]  subjectList: ${subjectList.length}`)

      const headUsedDiff = heapUsedAfter - heapUsedBefore
      console.log(`  #${String(testRound).padStart(3, '0')} headUsedDiff: ${formatMemory(headUsedDiff)}, perSubject: ${formatMemory((headUsedDiff / subjectList.length).toFixed(2))}`)

      resultList[ testRound ] = headUsedDiff
      testRound++
    }

    const mainResultList = dropOutstandingValue(resultList, testDropRound) // drop some outstanding value
    // console.log({ resultList, mainResultList })

    const resultAvg = mainResultList.reduce((o, v) => o + v, 0) / mainResultList.length

    console.log([
      `[RESULT] ${title} (${testDropRound} dropped) `.padEnd(64, '-'),
      `- avgHeadUsedDiff: ${formatMemory(resultAvg.toFixed(2))}`,
      `- avgPerSubject:   ${formatMemory((resultAvg / testSubjectCount).toFixed(2))}`
    ].join('\n'))

    verifyPrediction(predictionAvg, resultAvg / testSubjectCount, title)
  }

  const runSubjectPredictionTestConfig = async ({ testConfigName, testKeepRound, testDropRound, testSubjectCount, testList }) => {
    console.log(`[main] testConfigName: ${testConfigName}, testList: ${testList.length}`)
    for (const [ title, predictionAvg, funcCreateSubject ] of testList) {
      await runSubjectPredictionTest({
        testKeepRound, testDropRound, testSubjectCount,
        title, predictionAvg, funcCreateSubject
      }).catch((error) => {
        console.error('[main] error:', error)
        process.exit(1)
      })
    }
    console.log('[main] done')
  }
  return {
    setTimeoutAsync,
    formatMemory, markMemory,
    appendPromiseAdder,
    dropOutstandingValue,
    verifyPrediction,
    runSubjectPredictionTest, runSubjectPredictionTestConfig
  }
}

export {
  runFuncWithExposeGC,
  createTestFunc,
  commonFunc
}
