import { createTestFunc, commonFunc } from './function.test'

const { describe, it } = global

process.env.TEST_SANITY && describe('Node.SanityTest.MemoryUsageDataType (very slow)', () => {
  it('basic data type', createTestFunc(0, commonFunc, async (triggerGC, { formatMemory, markMemory, runSubjectPredictionTestConfig }) => runSubjectPredictionTestConfig({
    testConfigName: 'rough data size test',
    testKeepRound: 6, // suggest at least 4
    testDropRound: 3, // first 2-4 result may be less stable
    testSubjectCount: 64 * 1024, // number of test subject (for 8K and 256K the result should not change much or the test is flowed)
    // testKeepRound: 2, testDropRound: 2, testSubjectCount: 4 * 1024, // FASTER DEV TEST CONFIG
    testList: [ // [ title, predictionAvg, funcCreateSubject ]
      [ 'number (same)', '0±0.1', () => 0 ], // 0 means the array itself holds the value, without needing to allocate other memory
      [ 'number (dynamic)', '0±0.1', (index) => index ],

      [ 'string (same)', '0±0.1', () => '0' ],
      [ 'string (dynamic)', '24±0.1', (index) => String(index) ],

      [ 'object (minimal)', '0±0.1', () => {} ],
      [ 'object (dynamic)', '40±0.1', (index) => ({ index, some: 'value' }) ]
    ]
  })))

  it('promise', createTestFunc(0, commonFunc, async (triggerGC, { formatMemory, markMemory, runSubjectPredictionTestConfig, isNodejs15 = Number(process.versions.node.split('.')[ 0 ]) >= 15 }) => runSubjectPredictionTestConfig({
    testConfigName: 'rough data size test',
    testKeepRound: 6, // suggest at least 4
    testDropRound: 3, // first 2-4 result may be less stable
    testSubjectCount: 64 * 1024, // number of test subject (for 8K and 256K the result should not change much or the test is flowed)
    // testKeepRound: 2, testDropRound: 2, testSubjectCount: 4 * 1024, // FASTER DEV TEST CONFIG
    testList: [ // [ title, predictionAvg, funcCreateSubject ]
      [ 'promise (basic)', '0±0.1', () => new Promise((resolve) => resolve('value')) ],
      [ 'promise (then)', '0±0.1', (index) => new Promise((resolve) => { resolve(index) }).then((value) => value) ],
      [ 'promise (Promise.resolve)', '0±0.1', () => Promise.resolve('value') ],
      [ 'promise (Promise.all with 1 value)', isNodejs15 ? '56±0.1' : '64±0.1', () => Promise.all([ Promise.resolve(0) ]) ],
      [ 'promise (Promise.all with 2 value)', isNodejs15 ? '64±0.1' : '72±0.1', () => Promise.all([ Promise.resolve(0), Promise.resolve(1) ]) ],
      [ 'promise (Promise.all with 3 value)', isNodejs15 ? '72±0.1' : '80±0.1', () => Promise.all([ Promise.resolve(0), Promise.resolve(1), Promise.resolve(2) ]) ]
    ]
  })))

  it('function', createTestFunc(0, commonFunc, async (triggerGC, { formatMemory, markMemory, runSubjectPredictionTestConfig, isNodejs14 = Number(process.versions.node.split('.')[ 0 ]) >= 14 }) => runSubjectPredictionTestConfig({
    testConfigName: 'rough data size test',
    testKeepRound: 6, // suggest at least 4
    testDropRound: 3, // first 2-4 result may be less stable
    testSubjectCount: 64 * 1024, // number of test subject (for 8K and 256K the result should not change much or the test is flowed)
    // testKeepRound: 2, testDropRound: 2, testSubjectCount: 4 * 1024, // FASTER DEV TEST CONFIG
    testList: [ // [ title, predictionAvg, funcCreateSubject ]
      [ 'named function (minimal)', '64±0.1', () => function n () {} ],
      [ 'named function (basic)', '64±0.1', () => function namedFunction (arg0, arg1) { console.log('named function', arg0, arg1) } ],

      [ 'arrow function (minimal)', '56±0.1', () => () => {} ],
      [ 'arrow function (basic)', '56±0.1', () => (arg0, arg1) => { console.log('arrow function', arg0, arg1) } ],
      [ 'arrow function (longer content)', '56±0.1', () => (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, ...argList) => {
        for (let index = 0; index <= 999; index++) console.log(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, ...argList)
        const funcA = (arg0, arg1) => { console.log('arrow function', arg0, arg1) }
        const funcB = (arg0, arg1) => { console.log('arrow function', arg0, arg1) }
        const funcC = (arg0, arg1) => { funcB('arrow function', funcA(arg0), arg1) }
        console.log('arrow function (longer content)', funcC(funcA(funcB)))
        formatMemory() // reference to outer func
        markMemory() // reference to outer func
        runSubjectPredictionTestConfig() // reference to outer func
      } ],
      [ 'arrow function (closure with 1 object)', isNodejs14 ? '128±0.1' : '144±0.1', (index) => {
        const objectA = { index }
        return () => { console.log('arrow function', objectA) }
      } ],
      [ 'arrow function (closure with 1 arrow function)', isNodejs14 ? '152±0.1' : '168±0.1', () => {
        const funcA = (arg0, arg1) => { console.log('arrow function', arg0, arg1) }
        return () => { funcA('arrow function') }
      } ],
      [ 'arrow function (closure with 3 value)', isNodejs14 ? '280±0.1' : '296±0.1', () => {
        const funcA = (arg0, arg1) => { console.log('arrow function', arg0, arg1) }
        const funcB = (arg0, arg1) => { console.log('arrow function', arg0, arg1) }
        const funcC = (arg0, arg1) => { funcB('arrow function', funcA(arg0), arg1) }
        return () => { console.log('arrow function', funcC(funcA(funcB))) }
      } ],
      [ 'arrow function (deeper closure with 3 value)', isNodejs14 ? '280±0.1' : '296±0.1', () => {
        const funcA = (arg0, arg1) => { console.log('arrow function', arg0, arg1) }
        const funcB = (arg0, arg1) => { console.log('arrow function', funcA(arg0, arg1)) }
        const funcC = (arg0, arg1) => { funcB('arrow function', arg0, arg1) }
        return () => { funcC('arrow function') }
      } ]
    ]
  })))
})
