// Compare the execute order of Promise, async/await
(() => {
  const isNode = typeof (process) === 'object'
  const tagOrderMap = {}
  const tag = (tag, message = '') => console.warn(`[${tag}|${tagOrderMap[ tag ]++}] ${message}`)
  const defineTag = (tag) => {
    tagOrderMap[ tag ] = 0
    console.warn(`[${tag}] `.padEnd(48, '-'))
  }

  const test = async () => {
    tag('BASE', 'begin function')
    await tag('BASE', 'before simple await')
    tag('promise 0', 'after simple await')
    await undefined
    tag('promise 1', 'ASYNC')
    await undefined
    tag('promise 2', 'ASYNC')
    await 0
    tag('promise 3', 'ASYNC')
    await Promise.resolve()
    tag('promise 6', 'ASYNC')
    await 0
    await 0
    await 0
    tag('promise 9', 'end function')
  }

  // set queue order mark
  defineTag('BASE')
  isNode && process.nextTick(() => defineTag('nextTick'))
  setTimeout(() => {
    defineTag('setTimeout')
    isNode && process.nextTick(() => defineTag('setTimeout - nextTick'))
  }, 0)
  Promise.resolve().then(() => isNode && process.nextTick(() => defineTag('promise - nextTick')))
  Promise.resolve()
    .then(() => defineTag('promise 0'))
    .then(() => defineTag('promise 1'))
    .then(() => defineTag('promise 2'))
    .then(() => defineTag('promise 3'))
    .then(() => defineTag('promise 4'))
    .then(() => defineTag('promise 5'))
    .then(() => defineTag('promise 6'))
    .then(() => defineTag('promise 7'))
    .then(() => defineTag('promise 8'))
    .then(() => defineTag('promise 9'))
    .then(() => defineTag('promise 10'))

  // start test
  test()
    .then(() => tag('promise 10', 'test RESOLVE'))

  tag('BASE', 'last line of code')
})()
