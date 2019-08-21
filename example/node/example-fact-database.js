const { addExitListenerSync } = require('../../output-gitignore/library/node/system/ExitListener')
const { createFactDatabase, tryDeleteExtraCache } = require('../../output-gitignore/library/node/module/FactDatabase')

const main = async () => {
  const factDB = await createFactDatabase({
    pathFactDirectory: `${__dirname}/fact-gitignore`,
    onError: console.error
  })

  await tryDeleteExtraCache({ pathFactDirectory: `${__dirname}/fact-gitignore` })

  const logFactDBState = () => console.log('state:', JSON.stringify(factDB.getState()))

  addExitListenerSync((event) => {
    console.log('listenerSync', event)
    factDB.add({ key1: 3, key2: 6, key3: 9 })
    factDB.add({ exitAt: (new Date()).toString() })
    logFactDBState()
    factDB.end()
  })

  console.log('init')
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

  factDB.add({ [ `IncrementalKey-${Date.now()}` ]: 'time' })
  factDB.add({}) // empty fact
  // factDB.add(null) // will fail
  logFactDBState()

  factDB.add({ key1: 1, key2: 2, key3: 3 })
  logFactDBState()

  factDB.add({ saveAt: (new Date()).toString() })
  factDB.save()

  factDB.add({ key1: 2, key2: 4, key3: 6 })
  logFactDBState()

  // setTimeout(() => process.exit(), 1)
  // process.nextTick(() => process.exit())
  // process.exit()

  factDB.end()
}

main().catch(console.error)
