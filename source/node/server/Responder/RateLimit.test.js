import { strictEqual } from 'source/common/verify'
import { setTimeoutAsync } from 'source/common/time'
import { createResponderRateLimit, createResponderCheckRateLimit } from './RateLimit'

const { describe, it } = global

describe('Node.Server.Responder.RateLimit', () => {
  it('createResponderRateLimit()', async () => {
    let next = null
    let deny = null

    const store0 = { requestKey: 'requestKey0' }
    const store1 = { requestKey: 'requestKey1' }

    const responderRateLimit = createResponderRateLimit({
      responderNext: (store, limitLeft) => { next = limitLeft },
      responderDeny: (store, limitLeft) => { deny = limitLeft },
      getRequestKey: (store) => store.requestKey,
      limitCount: 4,
      expireTime: 10
    })

    const sanityTest = () => {
      next = deny = null

      responderRateLimit(store0)
      strictEqual(next, 4)

      responderRateLimit(store1)
      strictEqual(next, 4)

      responderRateLimit(store0)
      strictEqual(next, 3)

      responderRateLimit(store1)
      strictEqual(next, 3)

      responderRateLimit(store0)
      strictEqual(next, 2)

      responderRateLimit(store1)
      strictEqual(next, 2)

      responderRateLimit(store0)
      strictEqual(next, 1)

      responderRateLimit(store1)
      strictEqual(next, 1)

      responderRateLimit(store0)
      strictEqual(deny, 0)

      responderRateLimit(store1)
      strictEqual(deny, 0)

      responderRateLimit(store0)
      strictEqual(deny, 0)

      responderRateLimit(store1)
      strictEqual(deny, 0)
    }

    sanityTest()

    await setTimeoutAsync(20) // test limit reset

    sanityTest()
  })

  it('createResponderCheckRateLimit()', async () => {
    let next = null
    let deny = null

    const store0 = { requestKey: 'requestKey0', isCheckPass: true }
    const storeCheckDeny0 = { requestKey: 'requestKey0', isCheckPass: false }
    const store1 = { requestKey: 'requestKey1', isCheckPass: true }
    const storeCheckDeny1 = { requestKey: 'requestKey1', isCheckPass: false }

    const responderRateLimit = createResponderCheckRateLimit({
      checkFunc: (store, limitLeft) => store.isCheckPass, // return true to pass check
      responderNext: (store, limitLeft) => { next = limitLeft },
      responderDeny: (store, limitLeft) => { deny = limitLeft },
      getRequestKey: (store) => store.requestKey,
      limitCount: 4,
      expireTime: 10
    })

    const sanityTest = async () => {
      next = deny = null

      await responderRateLimit(store0)
      strictEqual(next, 4)
      await responderRateLimit(storeCheckDeny0)
      strictEqual(deny, 4)

      await responderRateLimit(store1)
      strictEqual(next, 4)
      await responderRateLimit(storeCheckDeny1)
      strictEqual(deny, 4)

      await responderRateLimit(store0)
      strictEqual(next, 3)
      await responderRateLimit(storeCheckDeny0)
      strictEqual(deny, 3)

      await responderRateLimit(store1)
      strictEqual(next, 3)
      await responderRateLimit(storeCheckDeny1)
      strictEqual(deny, 3)

      await responderRateLimit(store0)
      strictEqual(next, 2)
      await responderRateLimit(storeCheckDeny0)
      strictEqual(deny, 2)

      await responderRateLimit(store1)
      strictEqual(next, 2)
      await responderRateLimit(storeCheckDeny1)
      strictEqual(deny, 2)

      await responderRateLimit(store0)
      strictEqual(next, 1)
      await responderRateLimit(storeCheckDeny0)
      strictEqual(deny, 1)

      await responderRateLimit(store1)
      strictEqual(next, 1)
      await responderRateLimit(storeCheckDeny1)
      strictEqual(deny, 1)

      await responderRateLimit(store0)
      strictEqual(deny, 0)
      await responderRateLimit(storeCheckDeny0)
      strictEqual(deny, 0)

      await responderRateLimit(store1)
      strictEqual(deny, 0)
      await responderRateLimit(storeCheckDeny1)
      strictEqual(deny, 0)

      await responderRateLimit(store0)
      strictEqual(deny, 0)
      await responderRateLimit(storeCheckDeny0)
      strictEqual(deny, 0)

      await responderRateLimit(store1)
      strictEqual(deny, 0)
      await responderRateLimit(storeCheckDeny1)
      strictEqual(deny, 0)
    }

    await sanityTest()

    await setTimeoutAsync(20) // test limit reset

    await sanityTest()
  })
})
