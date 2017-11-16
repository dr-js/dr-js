// Compare the execute order of Promise, setTimeout, & nextTick
(() => {
  const isNode = typeof (process) === 'object'
  const tagOrderMap = {}
  const tag = (tag, message = '') => console.warn(`[${tag}|${tagOrderMap[ tag ]++}] ${message}`)
  const defineTag = (tag) => {
    tagOrderMap[ tag ] = 0
    console.warn(`[${tag}] `.padEnd(48, '-'))
  }

  const test = () => {
    tag('BASE', 'begin function')

    isNode && process.nextTick(() => tag('nextTick'))
    setTimeout(() => {
      tag('setTimeout')
      isNode && process.nextTick(() => tag('setTimeout - nextTick'))
    }, 0)

    const promiseHead = new Promise((resolve) => {
      tag('BASE', 'before resolve')
      resolve('ValueA')
      tag('BASE', 'after resolve')
      isNode && process.nextTick(() => tag('nextTick'))
      setTimeout(() => tag('setTimeout'), 0)
    })

    isNode && process.nextTick(() => tag('nextTick'))
    setTimeout(() => tag('setTimeout'), 0)

    promiseHead
      .then((value) => tag('promise 0', `get value: ${value}`))
      .catch((error) => tag('promise 1', `[Not called] error: ${error.message}`))
      .then((value) => tag('promise 2', `get value: ${value}`))
      .then((value) => tag('promise 3', `get value: ${value}`))
      .then((value) => tag('promise 4', `get value: ${value}`))

    promiseHead
      .then((value) => {
        isNode && process.nextTick(() => tag('promise - nextTick'))
        tag('promise 0', `get value: ${value}`)
        throw new Error('Value')
      })
      .then(() => tag('promise 1', '[Not called]'))
      .then(() => tag('promise 2', '[Not called]'))
      .then(() => tag('promise 3', '[Not called]'))
      .then(() => tag('promise 4', '[Not called]'))
      .then(() => tag('promise 5', '[Not called]'))
      .then(() => tag('promise 6', '[Not called]'))
      .then(() => tag('promise 7', '[Not called]'))
      .catch((error) => {
        isNode && process.nextTick(() => tag('promise - nextTick'))
        tag('promise 8', `error: ${error.message}`)
        return 'Some Value'
      })
      .then((value) => tag('promise 9', `get value: ${value}`))

    tag('BASE', 'end function')
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
    .then(() => defineTag('promise 11'))
    .then(() => defineTag('promise 12'))
    .then(() => defineTag('promise 13'))
    .then(() => defineTag('promise 14'))
    .then(() => defineTag('promise 15'))
    .then(() => defineTag('promise 16'))
    .then(() => defineTag('promise 17'))

  // uncomment to see reference queue
  // Promise.resolve()
  //   .then(() => tag('promise 0', 'REF'))
  //   .then(() => tag('promise 1', 'REF'))
  //   .then(() => tag('promise 2', 'REF'))
  //   .then(() => tag('promise 3', 'REF'))
  //   .then(() => {
  //     tag('promise 4', 'REF')
  //     return Promise.resolve()
  //       .then(() => tag('promise 5', 'REF'))
  //       .then(() => tag('promise 6', 'REF'))
  //       .then(() => tag('promise 7', 'REF'))
  //       .then(() => tag('promise 8', 'REF'))
  //   })
  //   .then(() => tag('promise 9', 'REF'))
  //   .then(() => tag('promise 10', 'REF'))
  //   .then(() => tag('promise 11', 'REF'))
  //   .then(() => tag('promise 12', 'REF'))
  //   .then(() => tag('promise 13', 'REF'))
  //   .then(() => new Promise((resolve) => setTimeout(resolve, 0)))
  //   .then(() => tag('promise 14', 'REF'))
  //   .then(() => tag('promise 15', 'REF'))
  //   .then(() => tag('promise 16', 'REF'))
  //   .then(() => tag('promise 17', 'REF'))

  // start test
  test()
  tag('BASE', 'last line of code')
})()
