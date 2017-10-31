const Dr = require('../Dr.node')

// console.log(Object.keys(Dr))
// console.log(Object.keys(Dr.Node))

const { System: { setProcessExitListener }, Module: { createFactDatabase } } = Dr.Node

const main = async () => {
  const factDB = await createFactDatabase({
    applyFact: (state, fact) => ({ ...state, ...fact }),
    encodeFact: JSON.stringify, // (fact) => factText
    decodeFact: JSON.parse, // (factText) => fact
    pathFactDirectory: `${__dirname}/fact`,
    // queueLengthThreshold: 100,
    logFilePrefix: 'fact',
    cacheStateFileName: 'factCacheState.json',
    onError: console.error
  })

  setProcessExitListener({
    listenerSync: ({ eventType, code }) => {
      console.log('listenerSync', eventType, code)
      factDB.addFact({ key1: 2 })
      factDB.addFact({ key2: 4 })
      factDB.addFact({ key3: 6 })
      console.log('state:', factDB.getState())
      factDB.end()
    }
  })

  console.log('inited:', factDB)
  console.log('state:', factDB.getState())

  factDB.addFact({ key1: 1 })
  factDB.addFact({ key2: 2 })
  factDB.addFact({ key3: 3 })
  console.log('state:', factDB.getState())

  factDB.addFact({ key1: 2 })
  factDB.addFact({ key2: 4 })
  factDB.addFact({ key3: 6 })
  console.log('state:', factDB.getState())

  factDB.addFact({ [Date.now()]: 'time' })
  factDB.addFact({})
  // factDB.addFact(null) // will fail
  console.log('state:', factDB.getState())

  factDB.addFact({ key1: 1 })
  factDB.addFact({ key2: 2 })
  factDB.addFact({ key3: 3 })
  console.log('state:', factDB.getState())

  factDB.addFact({ key1: 2 })
  factDB.addFact({ key2: 4 })
  factDB.addFact({ key3: 6 })
  console.log('state:', factDB.getState())
  // setTimeout(() => process.exit(), 1)
  // process.exit()
}

main().catch(console.error)
