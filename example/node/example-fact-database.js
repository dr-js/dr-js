const Dr = require('../../library/Dr.node')

const { System: { setProcessExitListener }, Module: { createFactDatabase } } = Dr.Node

const main = async () => {
  const factDB = await createFactDatabase({
    applyFact: (state, fact) => ({ ...state, ...fact }),
    encodeFact: JSON.stringify, // (fact) => factText
    decodeFact: JSON.parse, // (factText) => fact
    pathFactDirectory: `${__dirname}/fact-gitignore`,
    // queueLengthThreshold: 100,
    onError: console.error
  })

  const logFactDBState = () => console.log('state:', JSON.stringify(factDB.getState()))

  setProcessExitListener({
    listenerSync: ({ eventType, code }) => {
      console.log('listenerSync', eventType, code)
      factDB.add({ key1: 2 })
      factDB.add({ key2: 4 })
      factDB.add({ key3: 6 })
      factDB.add({ exitAt: (new Date()).toString() })
      logFactDBState()
      factDB.end()
    }
  })

  console.log('init:', factDB)
  logFactDBState()

  factDB.add({ key1: 1 })
  factDB.add({ key2: 2 })
  factDB.add({ key3: 3 })
  logFactDBState()

  factDB.add({ key1: 2 })
  factDB.add({ key2: 4 })
  factDB.add({ key3: 6 })
  logFactDBState()

  factDB.add({ splitAt: (new Date()).toString() })
  factDB.split()

  factDB.add({ [`IncrementalKey-${Date.now()}`]: 'time' })
  factDB.add({}) // empty fact
  // factDB.add(null) // will fail
  logFactDBState()

  factDB.add({ key1: 1 })
  factDB.add({ key2: 2 })
  factDB.add({ key3: 3 })
  logFactDBState()

  factDB.add({ saveAt: (new Date()).toString() })
  factDB.save()

  factDB.add({ key1: 2 })
  factDB.add({ key2: 4 })
  factDB.add({ key3: 6 })
  logFactDBState()

  // setTimeout(() => process.exit(), 1)
  // process.nextTick(() => process.exit())
  // process.exit()
}

main().catch(console.error)
