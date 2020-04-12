import { typeNameOf } from 'source/common/format'

const { describe, it, info = console.log } = global

const TEST_FUNC_LIST = [
  // anonymous function
  function () {},
  function () { console.log('some code') },
  function () {
    do { // some comment
      console.log('some code')
    } while (Math.random())
  },
  // function
  function AAA () {},
  function AAA () { console.log('some code') },
  function AAA () {
    do { // some comment
      console.log('some code')
    } while (Math.random())
  },
  // arrow function
  () => {},
  () => { console.log('some code') },
  () => {
    do { // some comment
      console.log('some code')
    } while (Math.random())
  },
  // async function
  async function AAA () {},
  async function AAA () { console.log('some code') },
  async function AAA () {
    do { // some comment
      console.log('some code')
    } while (Math.random())
  },
  // async arrow function
  async () => {},
  async () => { console.log('some code') },
  async () => {
    do { // some comment
      console.log('some code')
    } while (Math.random())
  },
  // generator function
  function * AAA () {},
  function * AAA () { console.log('some code') },
  function * AAA () {
    do { // some comment
      console.log('some code')
    } while (Math.random())
  },
  // async generator function // since nodejs@10
  async function * AAA () {},
  async function * AAA () { console.log('some code') },
  async function * AAA () {
    do { // some comment
      console.log('some code')
    } while (Math.random())
  },
  // Object Method definitions
  ({
    AAA () {}
  }).AAA,
  ({
    '' () { /* same name as anonymous function */ }
  })[ '' ],
  ({
    [ Math.PI ] () { /* name is from outer context */ }
  })[ Math.PI ],
  ({
    async * '{!@#!@#!@#$#$\n}' () { yield 1 } // since nodejs@10
  })[ '{!@#!@#!@#$#$\n}' ],
  // function with name change
  (() => {
    const func = function AAA () { /* the name will get changed later */ }
    Object.defineProperty(func, 'name', { value: 'BBB' })
    try {
      func.name = 'CCC' // won't work
    } catch (error) {}
    return func
  })()
]

describe('Common.SanityTest.FunctionStringify', () => {
  it('FunctionStringify', async () => { // TODO: NOTE: this is not a test, but left here to show it's harder to pick out the content from `String(func)`
    info(TEST_FUNC_LIST.map((func) => [
      `funcType: ${JSON.stringify(typeNameOf(func))}`, // Function|AsyncFunction|GeneratorFunction|AsyncGeneratorFunction
      `funcName: ${JSON.stringify(func.name)}`,
      `funcText: ${JSON.stringify(String(func))}`
    ].join('\n')).join('\n\n'))
  })
})
