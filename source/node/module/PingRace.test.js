import {
  pingRaceUrlList,
  pingStatUrlList
} from './PingRace.js'

const { describe, it, info = console.log } = globalThis

const TEST_URL_LIST = [
  // TODO: NOTE: the noop dns lookup may take ~10sec on win32 and block node exit, but there's no API to stop dns lookup, check: https://github.com/nodejs/node/issues/7231
  'http://noop.dr.run', // allow non-exist DNS
  'https://noop.dr.run', // allow non-exist DNS
  'http://dr.run',
  'https://dr.run',
  'http://github.com',
  'https://github.com',
  'https://stackoverflow.com'
]

describe('Node.Module.PingRace', () => {
  it('pingRaceUrlList()', async () => {
    info(`url: ${await pingRaceUrlList([])}`) // fast exit
    info(`url: ${await pingRaceUrlList(TEST_URL_LIST)}`)
  })

  it('pingStatUrlList()', async () => {
    info(`statMap: ${JSON.stringify(await pingStatUrlList([], { timeout: 2 * 1000 }), null, 2)}`)
    info(`statMap: ${JSON.stringify(await pingStatUrlList(TEST_URL_LIST, { timeout: 2 * 1000 }), null, 2)}`)
  })
})
