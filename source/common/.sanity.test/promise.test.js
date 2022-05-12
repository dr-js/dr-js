import { strictEqual, stringifyEqual } from 'source/common/verify.js'
import { createInsideOutPromise } from 'source/common/function.js'

const { describe, it, info = console.log } = globalThis
const log = __DEV__ ? info : () => {}
const isNode = (typeof (process) !== 'undefined' && typeof (process.nextTick) !== 'undefined')

const createTagList = () => {
  const tagList = []
  const tagOrderMap = {}
  const defineTag = (tag) => {
    if (tagOrderMap[ tag ] !== undefined) throw new Error(`no re-define tag: ${tag}`) // no re-define
    tagOrderMap[ tag ] = 0
    tagList.push(`[${tag}|DEFINE] `.padEnd(80, '-'))
  }
  const tag = (tag, message = '') => {
    if (tagOrderMap[ tag ] === undefined) throw new Error(`undefined tag: ${tag}, message: ${message}`) // must define first
    tagList.push([ `[${tag}|#${tagOrderMap[ tag ]++}]`, message ].filter(Boolean).join(' '))
  }
  return { tagList, defineTag, tag }
}

process.env.TEST_SANITY && describe('Common.SanityTest.Promise', () => {
  it('Promise.resolve(Promise.resolve())', async () => {
    const value = {}

    const promise0 = Promise.resolve(value)
    const promise1 = Promise.resolve(promise0) // return promise itself
    strictEqual(promise0, promise1)

    const result0 = await promise0
    const result1 = await promise1
    strictEqual(result0, result1) // same promise, same result
  })

  it('promise return to resolve will get resolved', async () => {
    const value = {}

    const promise0 = Promise.resolve(value)
    const promise1 = new Promise((resolve) => resolve(promise0)) // not the value directly

    const result0 = await promise0
    const result1 = await promise1
    strictEqual(value, result0)
    strictEqual(result0, result1)
  })

  it('only the first resolve/reject count', () => Promise.all([
    new Promise((resolve, reject) => {
      resolve('good resolve')
      reject(new Error('should be ignored'))
      reject(new Error('should be ignored'))
      reject(new Error('should be ignored'))
      reject(new Error('should be ignored'))
      resolve('bad resolve')
    }).then((result) => {
      if (result !== 'good resolve') throw new Error(`unexpected result: ${result}`)
      log('expected resolve:', result)
    }),
    new Promise((resolve, reject) => {
      reject(new Error('good reject'))
      reject(new Error('should be ignored'))
      resolve('bad resolve')
      reject(new Error('should be ignored'))
      resolve('also bad resolve')
      reject(new Error('should be ignored'))
    }).then((result) => { throw new Error(`unexpected resolve: ${result}`) }, (error) => {
      if (!error.message.includes('good reject')) throw new Error(`unexpected reject: ${error}`)
      log('expected reject:', error)
    })
  ]))

  it('executor throw error result in Promise reject', () => {
    let promise
    try {
      promise = new Promise(() => { throw new Error('error from executor') })
        .catch((error) => {
          if (!error.message.includes('error from executor')) throw new Error('unexpected error message')
          log('expected reject error:', error)
        })
    } catch (error) { throw new Error('unexpected sync error') }
    return promise
  })

  it('onFulfilled/onRejected throw error result in Promise reject', () => new Promise((resolve) => { resolve() })
    .then(() => { throw new Error('error from onFulfilled') })
    .catch((error) => {
      if (!error.message.includes('error from onFulfilled')) throw new Error('unexpected error message')
      log('expected onFulfilled error:', error)
    })
    .then(() => Promise.reject(new Error('test reject')))
    .then(() => { throw new Error('unexpected fulfill') }, (error) => {
      if (!error.message.includes('test reject')) throw new Error('unexpected error message')
      log('expected onRejected error:', error)
    })
  )

  it('pass non-function to then() result in nothing and cause no error', () => new Promise((resolve) => { resolve('RESULT') })
    .then()
    .then(undefined)
    .then(1, false)
    .then({}, [], () => {})
    .then((result) => {
      if (result !== 'RESULT') throw new Error('unexpected result')
      log('expected result:', result)
    })
  )

  it('sync resolve order decide the callback order', () => {
    const { tagList, tag, defineTag } = createTagList()
    defineTag('test')

    const promise = Promise.resolve() // reference promise
      .then(() => defineTag('then'))
      .then(() => defineTag('then-then'))
      .then(() => defineTag('then-then-then'))

    let resolve0
    const promise0 = new Promise((resolve) => {
      resolve0 = resolve
    }).then(() => tag('then-then', 'resolve0'))

    let resolve1
    const promise1 = new Promise((resolve) => {
      resolve1 = resolve
    }).then(() => tag('then-then', 'resolve1'))

    Promise.resolve().then(() => {
      tag('then', 'resolve in reverse order for create')
      resolve1()
      resolve0()
    })

    return Promise.all([
      promise,
      promise0, promise1
    ]).then(() => {
      log(tagList.join('\n'))
      stringifyEqual(tagList, [
        '[test|DEFINE] ------------------------------------------------------------------',
        '[then|DEFINE] ------------------------------------------------------------------',
        '[then|#0] resolve in reverse order for create',
        '[then-then|DEFINE] -------------------------------------------------------------',
        '[then-then|#0] resolve1',
        '[then-then|#1] resolve0',
        '[then-then-then|DEFINE] --------------------------------------------------------'
      ])
    })
  })

  it('later added then-then run before then-then-then', () => {
    const { tagList, tag, defineTag } = createTagList()
    defineTag('test')

    const promise = Promise.resolve() // reference promise
      .then(() => defineTag('then'))
      .then(() => defineTag('then-then'))
      .then(() => defineTag('then-then-then'))

    const promiseT = Promise.resolve().then(() => tag('then', 'T'))
    const promiseTT = promiseT.then(() => tag('then-then', 'TT'))
    const promiseTTT = promiseTT.then(() => tag('then-then-then', 'TTT'))

    const promiseTT0 = promiseT.then(() => tag('then-then', '0'))
    const promiseTTT0 = promiseTT.then(() => tag('then-then-then', '0'))

    const promiseTT1 = promiseT.then(() => tag('then-then', '1'))
    const promiseTTT1 = promiseTT.then(() => tag('then-then-then', '1'))

    const promiseTT2 = promiseT.then(() => tag('then-then', '2'))
    const promiseTTT2 = promiseTT.then(() => tag('then-then-then', '2'))

    const promiseEnd = Promise.resolve() // reference promise
      .then(() => tag('then', 'end'))
      .then(() => tag('then-then', 'end'))
      .then(() => tag('then-then-then', 'end'))

    return Promise.all([
      promise,
      promiseT,
      promiseTT, promiseTT0, promiseTT1, promiseTT2,
      promiseTTT, promiseTTT0, promiseTTT1, promiseTTT2,
      promiseEnd
    ]).then(() => {
      log(tagList.join('\n'))
      stringifyEqual(tagList, [
        '[test|DEFINE] ------------------------------------------------------------------',
        '[then|DEFINE] ------------------------------------------------------------------',
        '[then|#0] T',
        '[then|#1] end',
        '[then-then|DEFINE] -------------------------------------------------------------',
        '[then-then|#0] TT',
        '[then-then|#1] 0',
        '[then-then|#2] 1',
        '[then-then|#3] 2',
        '[then-then|#4] end',
        '[then-then-then|DEFINE] --------------------------------------------------------',
        '[then-then-then|#0] TTT',
        '[then-then-then|#1] 0',
        '[then-then-then|#2] 1',
        '[then-then-then|#3] 2',
        '[then-then-then|#4] end'
      ])
    })
  })

  it('execute order for mixed Promise', () => {
    const { tagList, tag, defineTag } = createTagList()
    defineTag('sync')
    return Promise.all([
      Promise.resolve() // reference promise
        .then(() => defineTag('then'))
        .then(() => defineTag('then-then'))
        .then(() => defineTag('then-then-then'))
        .then(() => defineTag('then-then-then-then'))
        .then(() => defineTag('then-then-then-then-then')),

      new Promise((resolve) => {
        tag('sync', 'new Promise() executor')
        resolve()
      })
        .then(() => tag('then', 'new Promise()|then')),

      new Promise((resolve) => {
        tag('sync', 'new Promise() executor')
        resolve(Promise.resolve()) // +2 then
      })
        .then(() => tag('then-then-then', 'new Promise()+Promise.resolve()|then')),

      Promise.resolve()
        .then(() => {
          tag('then', 'Promise.resolve()|then')
          return 'simpleValue'
        })
        .then(() => tag('then-then', 'Promise.resolve()|then+simpleValue|then')),

      Promise.resolve()
        .then(() => {
          tag('then', 'Promise.resolve()|then')
          return Promise.resolve() // +2 then
        })
        .then(() => tag('then-then-then-then', 'Promise.resolve()|then+Promise.resolve()|then')),

      Promise.resolve().then(() => {
        tag('then', 'Promise.resolve()|then')
        return new Promise((resolve) => { // +2 then
          tag('then', 'Promise.resolve()|then+new Promise() executor')
          resolve()
        })
      }).then(() => tag('then-then-then-then', 'Promise.resolve()|then+new Promise()|then')),

      Promise.resolve() // reference promise
        .then(() => tag('then', 'Promise.resolve()|then'))
        .then(() => tag('then-then', 'Promise.resolve()|then|then'))
        .then(() => tag('then-then-then', 'Promise.resolve()|then|then|then'))
        .then(() => tag('then-then-then-then', 'Promise.resolve()|then|then|then|then'))
    ]).then(() => {
      log(tagList.join('\n'))
      stringifyEqual(tagList, [
        '[sync|DEFINE] ------------------------------------------------------------------',
        '[sync|#0] new Promise() executor',
        '[sync|#1] new Promise() executor',
        '[then|DEFINE] ------------------------------------------------------------------',
        '[then|#0] new Promise()|then',
        '[then|#1] Promise.resolve()|then',
        '[then|#2] Promise.resolve()|then',
        '[then|#3] Promise.resolve()|then',
        '[then|#4] Promise.resolve()|then+new Promise() executor',
        '[then|#5] Promise.resolve()|then',
        '[then-then|DEFINE] -------------------------------------------------------------',
        '[then-then|#0] Promise.resolve()|then+simpleValue|then',
        '[then-then|#1] Promise.resolve()|then|then',
        '[then-then-then|DEFINE] --------------------------------------------------------',
        '[then-then-then|#0] new Promise()+Promise.resolve()|then',
        '[then-then-then|#1] Promise.resolve()|then|then|then',
        '[then-then-then-then|DEFINE] ---------------------------------------------------',
        '[then-then-then-then|#0] Promise.resolve()|then+Promise.resolve()|then',
        '[then-then-then-then|#1] Promise.resolve()|then+new Promise()|then',
        '[then-then-then-then|#2] Promise.resolve()|then|then|then|then',
        '[then-then-then-then-then|DEFINE] ----------------------------------------------'
      ])
    })
  })

  it('execute order for mixed async', () => {
    const { tagList, tag, defineTag } = createTagList()

    defineTag('sync')

    const promise0 = Promise.resolve() // reference promise
      .then(() => defineTag('then'))
      .then(() => defineTag('then-then'))
      .then(() => defineTag('then-then-then'))
      .then(() => defineTag('then-then-then-then'))

    const promise1 = new Promise((resolve) => {
      tag('sync', 'new Promise+promise executor')
      resolve()
    })
      .then(() => tag('then', 'new Promise()|then'))

    const promise2 = (async () => {})()
      .then(() => tag('then', 'async () => {}|then'))

    const promise3 = (async () => {
      tag('sync', 'code before any await')
      await undefined
      tag('then', 'await')
      await Promise.resolve() // same
      tag('then-then', 'await|await')
      await new Promise(resolve => resolve()) // same
      tag('then-then-then', 'await|await|await')
    })()

    const promise4 = (async () => {
      await null
      await null
      await null
      tag('then-then-then', 'await|await|await') // no magic await merge
    })()

    const promise5 = (async () => {
      await Promise.resolve().then(() => {}).catch(() => {}) // await + ( then + catch ) = 3 * then
      tag('then-then-then', 'await+(then+catch)')
    })()

    const promise9 = Promise.resolve() // reference promise
      .then(() => tag('then', 'Promise.resolve()|then'))
      .then(() => tag('then-then', 'Promise.resolve()|then|then'))
      .then(() => tag('then-then-then', 'Promise.resolve()|then|then|then'))

    tag('sync', 'last line of code')

    return Promise.all([
      promise0, promise1, promise2, promise3, promise4, promise5,
      promise9
    ]).then(() => {
      log(tagList.join('\n'))
      stringifyEqual(tagList, [
        '[sync|DEFINE] ------------------------------------------------------------------',
        '[sync|#0] new Promise+promise executor',
        '[sync|#1] code before any await',
        '[sync|#2] last line of code',
        '[then|DEFINE] ------------------------------------------------------------------',
        '[then|#0] new Promise()|then',
        '[then|#1] async () => {}|then',
        '[then|#2] await',
        '[then|#3] Promise.resolve()|then',
        '[then-then|DEFINE] -------------------------------------------------------------',
        '[then-then|#0] await|await',
        '[then-then|#1] Promise.resolve()|then|then',
        '[then-then-then|DEFINE] --------------------------------------------------------',
        '[then-then-then|#0] await|await|await',
        '[then-then-then|#1] await|await|await',
        '[then-then-then|#2] await+(then+catch)',
        '[then-then-then|#3] Promise.resolve()|then|then|then',
        '[then-then-then-then|DEFINE] ---------------------------------------------------'
      ])
    })
  })

  it('execute order with setTimeout(), process.nextTick()', () => {
    const { tagList, tag, defineTag } = createTagList()

    defineTag('sync')

    const promiseList = []
    const pushInsideOutPromiseResolve = () => {
      const { promise, resolve } = createInsideOutPromise()
      promiseList.push(promise)
      return resolve
    }

    tag('sync', 'setup reference')

    { // then
      const resolveThen0 = pushInsideOutPromiseResolve()
      const resolveThen1 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveThen2 = pushInsideOutPromiseResolve()
      const resolveSetTimeout0 = pushInsideOutPromiseResolve()
      const resolveSetTimeout1 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveSetTimeout2 = pushInsideOutPromiseResolve()
      const resolveNextTick0 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveNextTick1 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveNextTick2 = isNode ? pushInsideOutPromiseResolve() : () => {}
      Promise.resolve().then(() => {
        defineTag('then')

        setTimeout(() => {
          defineTag('then-setTimeout')

          Promise.resolve().then(() => {
            defineTag('then-setTimeout-then')
            resolveThen0()
          })
          setTimeout(() => {
            defineTag('then-setTimeout-setTimeout')
            resolveSetTimeout0()
          })
          isNode && process.nextTick(() => {
            defineTag('then-setTimeout-nextTick')
            resolveNextTick0()
          })
        })

        isNode && process.nextTick(() => {
          defineTag('then-nextTick')

          Promise.resolve().then(() => {
            defineTag('then-nextTick-then')
            resolveThen1()
          })
          setTimeout(() => {
            defineTag('then-nextTick-setTimeout')
            resolveSetTimeout1()
          })
          isNode && process.nextTick(() => {
            defineTag('then-nextTick-nextTick')
            resolveNextTick1()
          })
        })
      }).then(() => {
        defineTag('then-then')

        setTimeout(() => {
          defineTag('then-then-setTimeout')
          resolveSetTimeout2()
        })
        isNode && process.nextTick(() => {
          defineTag('then-then-nextTick')
          resolveNextTick2()
        })
      }).then(() => {
        defineTag('then-then-then')
        resolveThen2()
      })
    }

    { // setTimeout
      // NOTE: nodejs@11 changed timer to align with browser behavior, so the result for nodejs@<=10 may be different
      //  - https://github.com/nodejs/node/issues/22257
      //  - https://github.com/nodejs/node/pull/22842
      const resolveThen0 = pushInsideOutPromiseResolve()
      const resolveThen1 = pushInsideOutPromiseResolve()
      const resolveThen2 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveSetTimeout0 = pushInsideOutPromiseResolve()
      const resolveSetTimeout1 = pushInsideOutPromiseResolve()
      const resolveSetTimeout2 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveNextTick0 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveNextTick1 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveNextTick2 = isNode ? pushInsideOutPromiseResolve() : () => {}
      setTimeout(() => { // reference setTimeout
        defineTag('setTimeout')

        Promise.resolve().then(() => {
          defineTag('setTimeout-then')

          setTimeout(() => {
            defineTag('setTimeout-then-setTimeout')
            resolveSetTimeout0()
          })
          isNode && process.nextTick(() => {
            defineTag('setTimeout-then-nextTick')
            resolveNextTick0()
          })
        }).then(() => {
          defineTag('setTimeout-then-then')
          resolveThen0()
        })

        setTimeout(() => {
          defineTag('setTimeout-setTimeout')

          Promise.resolve().then(() => {
            defineTag('setTimeout-setTimeout-then')
            resolveThen1()
          })
          setTimeout(() => {
            defineTag('setTimeout-setTimeout-setTimeout')
            resolveSetTimeout1()
          })
          isNode && process.nextTick(() => {
            defineTag('setTimeout-setTimeout-nextTick')
            resolveNextTick1()
          })
        })

        isNode && process.nextTick(() => {
          defineTag('setTimeout-nextTick')

          Promise.resolve().then(() => {
            defineTag('setTimeout-nextTick-then')
            resolveThen2()
          })
          setTimeout(() => {
            defineTag('setTimeout-nextTick-setTimeout')
            resolveSetTimeout2()
          })
          isNode && process.nextTick(() => {
            defineTag('setTimeout-nextTick-nextTick')
            resolveNextTick2()
          })
        })
      })
    }

    { // nextTick
      // NOTE: do not rely on it's execute order against Promise, they will mix up
      //  - https://stackoverflow.com/questions/50199376/nodejs-eventloop-execution-orderprocess-nexttick-and-promise
      //  - https://stackoverflow.com/questions/53138464/unexpected-behavior-mixing-process-nexttick-with-async-await-how-does-the-event
      const resolveThen0 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveThen1 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveThen2 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveSetTimeout0 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveSetTimeout1 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveSetTimeout2 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveNextTick0 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveNextTick1 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveNextTick2 = isNode ? pushInsideOutPromiseResolve() : () => {}
      isNode && process.nextTick(() => { // reference nextTick
        defineTag('nextTick')

        Promise.resolve().then(() => {
          defineTag('nextTick-then')

          setTimeout(() => {
            defineTag('nextTick-then-setTimeout')
            resolveSetTimeout0()
          })
          isNode && process.nextTick(() => {
            defineTag('nextTick-then-nextTick')
            resolveNextTick0()
          })
        }).then(() => {
          defineTag('nextTick-then-then')
          resolveThen0()
        })

        setTimeout(() => {
          defineTag('nextTick-setTimeout')

          Promise.resolve().then(() => {
            defineTag('nextTick-setTimeout-then')
            resolveThen1()
          })
          setTimeout(() => {
            defineTag('nextTick-setTimeout-setTimeout')
            resolveSetTimeout1()
          })
          isNode && process.nextTick(() => {
            defineTag('nextTick-setTimeout-nextTick')
            resolveNextTick1()
          })
        })

        isNode && process.nextTick(() => {
          defineTag('nextTick-nextTick')

          Promise.resolve().then(() => {
            defineTag('nextTick-nextTick-then')
            resolveThen2()
          })
          setTimeout(() => {
            defineTag('nextTick-nextTick-setTimeout')
            resolveSetTimeout2()
          })
          isNode && process.nextTick(() => {
            defineTag('nextTick-nextTick-nextTick')
            resolveNextTick2()
          })
        })
      })
    }

    tag('sync', 'setup reference again')

    { // then
      const resolveThen0 = pushInsideOutPromiseResolve()
      const resolveThen1 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveThen2 = pushInsideOutPromiseResolve()
      const resolveSetTimeout0 = pushInsideOutPromiseResolve()
      const resolveSetTimeout1 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveSetTimeout2 = pushInsideOutPromiseResolve()
      const resolveNextTick0 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveNextTick1 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveNextTick2 = isNode ? pushInsideOutPromiseResolve() : () => {}
      Promise.resolve().then(() => {
        tag('then')

        setTimeout(() => {
          tag('then-setTimeout')

          Promise.resolve().then(() => {
            tag('then-setTimeout-then')
            resolveThen0()
          })
          setTimeout(() => {
            tag('then-setTimeout-setTimeout')
            resolveSetTimeout0()
          })
          isNode && process.nextTick(() => {
            tag('then-setTimeout-nextTick')
            resolveNextTick0()
          })
        })

        isNode && process.nextTick(() => {
          tag('then-nextTick')

          Promise.resolve().then(() => {
            tag('then-nextTick-then')
            resolveThen1()
          })
          setTimeout(() => {
            tag('then-nextTick-setTimeout')
            resolveSetTimeout1()
          })
          isNode && process.nextTick(() => {
            tag('then-nextTick-nextTick')
            resolveNextTick1()
          })
        })
      }).then(() => {
        tag('then-then')

        setTimeout(() => {
          tag('then-then-setTimeout')
          resolveSetTimeout2()
        })
        isNode && process.nextTick(() => {
          tag('then-then-nextTick')
          resolveNextTick2()
        })
      }).then(() => {
        tag('then-then-then')
        resolveThen2()
      })
    }

    { // setTimeout
      const resolveThen0 = pushInsideOutPromiseResolve()
      const resolveThen1 = pushInsideOutPromiseResolve()
      const resolveThen2 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveSetTimeout0 = pushInsideOutPromiseResolve()
      const resolveSetTimeout1 = pushInsideOutPromiseResolve()
      const resolveSetTimeout2 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveNextTick0 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveNextTick1 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveNextTick2 = isNode ? pushInsideOutPromiseResolve() : () => {}
      setTimeout(() => { // reference setTimeout
        tag('setTimeout')

        Promise.resolve().then(() => {
          tag('setTimeout-then')

          setTimeout(() => {
            tag('setTimeout-then-setTimeout')
            resolveSetTimeout0()
          })
          isNode && process.nextTick(() => {
            tag('setTimeout-then-nextTick')
            resolveNextTick0()
          })
        }).then(() => {
          tag('setTimeout-then-then')
          resolveThen0()
        })

        setTimeout(() => {
          tag('setTimeout-setTimeout')

          Promise.resolve().then(() => {
            tag('setTimeout-setTimeout-then')
            resolveThen1()
          })
          setTimeout(() => {
            tag('setTimeout-setTimeout-setTimeout')
            resolveSetTimeout1()
          })
          isNode && process.nextTick(() => {
            tag('setTimeout-setTimeout-nextTick')
            resolveNextTick1()
          })
        })

        isNode && process.nextTick(() => {
          tag('setTimeout-nextTick')

          Promise.resolve().then(() => {
            tag('setTimeout-nextTick-then')
            resolveThen2()
          })
          setTimeout(() => {
            tag('setTimeout-nextTick-setTimeout')
            resolveSetTimeout2()
          })
          isNode && process.nextTick(() => {
            tag('setTimeout-nextTick-nextTick')
            resolveNextTick2()
          })
        })
      })
    }

    { // nextTick
      const resolveThen0 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveThen1 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveThen2 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveSetTimeout0 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveSetTimeout1 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveSetTimeout2 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveNextTick0 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveNextTick1 = isNode ? pushInsideOutPromiseResolve() : () => {}
      const resolveNextTick2 = isNode ? pushInsideOutPromiseResolve() : () => {}
      isNode && process.nextTick(() => { // reference nextTick
        tag('nextTick')

        Promise.resolve().then(() => {
          tag('nextTick-then')

          setTimeout(() => {
            tag('nextTick-then-setTimeout')
            resolveSetTimeout0()
          })
          isNode && process.nextTick(() => {
            tag('nextTick-then-nextTick')
            resolveNextTick0()
          })
        }).then(() => {
          tag('nextTick-then-then')
          resolveThen0()
        })

        setTimeout(() => {
          tag('nextTick-setTimeout')

          Promise.resolve().then(() => {
            tag('nextTick-setTimeout-then')
            resolveThen1()
          })
          setTimeout(() => {
            tag('nextTick-setTimeout-setTimeout')
            resolveSetTimeout1()
          })
          isNode && process.nextTick(() => {
            tag('nextTick-setTimeout-nextTick')
            resolveNextTick1()
          })
        })

        isNode && process.nextTick(() => {
          tag('nextTick-nextTick')

          Promise.resolve().then(() => {
            tag('nextTick-nextTick-then')
            resolveThen2()
          })
          setTimeout(() => {
            tag('nextTick-nextTick-setTimeout')
            resolveSetTimeout2()
          })
          isNode && process.nextTick(() => {
            tag('nextTick-nextTick-nextTick')
            resolveNextTick2()
          })
        })
      })
    }

    tag('sync', 'last line of code')

    return Promise.all(promiseList).then(() => {
      // log(tagList.filter((line) => !line.includes('setTimeout')).join('\n'))
      // log('\n\n\n\n')
      // log(tagList.filter((line) => !line.includes('nextTick')).join('\n'))
      // log('\n\n\n\n')
      log(tagList.join('\n'))
      stringifyEqual(tagList, [
        '[sync|DEFINE] ------------------------------------------------------------------',
        '[sync|#0] setup reference',
        '[sync|#1] setup reference again',
        '[sync|#2] last line of code',
        '[then|DEFINE] ------------------------------------------------------------------',
        '[then|#0]',
        '[then-then|DEFINE] -------------------------------------------------------------',
        '[then-then|#0]',
        '[then-then-then|DEFINE] --------------------------------------------------------',
        '[then-then-then|#0]',
        isNode && '[nextTick|DEFINE] --------------------------------------------------------------',
        isNode && '[nextTick|#0]',
        isNode && '[then-nextTick|DEFINE] ---------------------------------------------------------',
        isNode && '[then-nextTick|#0]',
        isNode && '[then-then-nextTick|DEFINE] ----------------------------------------------------',
        isNode && '[then-then-nextTick|#0]',
        isNode && '[nextTick-nextTick|DEFINE] -----------------------------------------------------',
        isNode && '[nextTick-nextTick|#0]',
        isNode && '[then-nextTick-nextTick|DEFINE] ------------------------------------------------',
        isNode && '[then-nextTick-nextTick|#0]',
        isNode && '[nextTick-nextTick-nextTick|DEFINE] --------------------------------------------',
        isNode && '[nextTick-nextTick-nextTick|#0]',
        isNode && '[nextTick-then|DEFINE] ---------------------------------------------------------',
        isNode && '[nextTick-then|#0]',
        isNode && '[then-nextTick-then|DEFINE] ----------------------------------------------------',
        isNode && '[then-nextTick-then|#0]',
        isNode && '[nextTick-nextTick-then|DEFINE] ------------------------------------------------',
        isNode && '[nextTick-nextTick-then|#0]',
        isNode && '[nextTick-then-then|DEFINE] ----------------------------------------------------',
        isNode && '[nextTick-then-then|#0]',
        isNode && '[nextTick-then-nextTick|DEFINE] ------------------------------------------------',
        isNode && '[nextTick-then-nextTick|#0]',
        '[setTimeout|DEFINE] ------------------------------------------------------------',
        isNode && '[setTimeout-nextTick|DEFINE] ---------------------------------------------------',
        isNode && '[setTimeout-nextTick-nextTick|DEFINE] ------------------------------------------',
        '[setTimeout-then|DEFINE] -------------------------------------------------------',
        isNode && '[setTimeout-nextTick-then|DEFINE] ----------------------------------------------',
        '[setTimeout-then-then|DEFINE] --------------------------------------------------',
        isNode && '[setTimeout-then-nextTick|DEFINE] ----------------------------------------------',
        '[setTimeout|#0]',
        isNode && '[setTimeout-nextTick|#0]',
        isNode && '[setTimeout-nextTick-nextTick|#0]',
        '[setTimeout-then|#0]',
        isNode && '[setTimeout-nextTick-then|#0]',
        '[setTimeout-then-then|#0]',
        isNode && '[setTimeout-then-nextTick|#0]',
        '[then-setTimeout|DEFINE] -------------------------------------------------------',
        isNode && '[then-setTimeout-nextTick|DEFINE] ----------------------------------------------',
        '[then-setTimeout-then|DEFINE] --------------------------------------------------',
        '[then-setTimeout|#0]',
        isNode && '[then-setTimeout-nextTick|#0]',
        '[then-setTimeout-then|#0]',
        '[then-then-setTimeout|DEFINE] --------------------------------------------------',
        '[then-then-setTimeout|#0]',
        isNode && '[nextTick-setTimeout|DEFINE] ---------------------------------------------------',
        isNode && '[nextTick-setTimeout-nextTick|DEFINE] ------------------------------------------',
        isNode && '[nextTick-setTimeout-then|DEFINE] ----------------------------------------------',
        isNode && '[nextTick-setTimeout|#0]',
        isNode && '[nextTick-setTimeout-nextTick|#0]',
        isNode && '[nextTick-setTimeout-then|#0]',
        isNode && '[then-nextTick-setTimeout|DEFINE] ----------------------------------------------',
        isNode && '[then-nextTick-setTimeout|#0]',
        isNode && '[nextTick-nextTick-setTimeout|DEFINE] ------------------------------------------',
        isNode && '[nextTick-nextTick-setTimeout|#0]',
        isNode && '[nextTick-then-setTimeout|DEFINE] ----------------------------------------------',
        isNode && '[nextTick-then-setTimeout|#0]',
        '[setTimeout-setTimeout|DEFINE] -------------------------------------------------',
        isNode && '[setTimeout-setTimeout-nextTick|DEFINE] ----------------------------------------',
        '[setTimeout-setTimeout-then|DEFINE] --------------------------------------------',
        isNode && '[setTimeout-nextTick-setTimeout|DEFINE] ----------------------------------------',
        '[setTimeout-then-setTimeout|DEFINE] --------------------------------------------',
        '[setTimeout-setTimeout|#0]',
        isNode && '[setTimeout-setTimeout-nextTick|#0]',
        '[setTimeout-setTimeout-then|#0]',
        isNode && '[setTimeout-nextTick-setTimeout|#0]',
        '[setTimeout-then-setTimeout|#0]',
        '[then-setTimeout-setTimeout|DEFINE] --------------------------------------------',
        '[then-setTimeout-setTimeout|#0]',
        isNode && '[nextTick-setTimeout-setTimeout|DEFINE] ----------------------------------------',
        isNode && '[nextTick-setTimeout-setTimeout|#0]',
        '[setTimeout-setTimeout-setTimeout|DEFINE] --------------------------------------',
        '[setTimeout-setTimeout-setTimeout|#0]'
      ].filter(Boolean))
    })
  })
})
