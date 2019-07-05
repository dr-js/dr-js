import { strictEqual } from 'source/common/verify'
import { getSampleRange } from 'source/common/math/sample'
import { getRandomId, getRandomInt, getRandomIntList } from 'source/common/math/random'
import { createDoublyLinkedList, createNode } from './LinkedList'

const { describe, it, info = console.log } = global

const getTestData = (length = getRandomInt(4, 16)) => {
  const linkedList = createDoublyLinkedList()
  const nodeList = getSampleRange(0, length - 1).map((index) => {
    const node = createNode(`Node${index}`)
    linkedList.push(node)
    return node
  })
  return { linkedList, nodeList, length }
}

const doSanityTest = (linkedList, length) => {
  it('should has head.prev === null', () => strictEqual(linkedList.getHead().prev, null))
  it('should has tail.next === null', () => strictEqual(linkedList.getTail().next, null))
  it(`should has length === ${length}`, () => strictEqual(linkedList.getLength(), length))
}

describe('Common.Data.LinkedList', () => {
  describe('LinkedList', () => {
    const linkedList = createDoublyLinkedList()
    doSanityTest(linkedList, 0)
  })

  describe('LinkedList.forEach', () => {
    const { linkedList, nodeList, length } = getTestData()
    doSanityTest(linkedList, length)
    linkedList.forEach((node, index) => it(
      `should has node.value === ${nodeList[ index ].value}`,
      () => strictEqual(node.value, nodeList[ index ].value)
    ))
  })

  describe('LinkedList.remove', () => {
    const { linkedList, nodeList, length } = getTestData()
    linkedList.remove(nodeList[ 1 ])
    linkedList.remove(nodeList[ length - 1 ])
    doSanityTest(linkedList, length - 2)
  })

  describe('LinkedList.removeBetween', () => {
    const { linkedList, nodeList, length } = getTestData()
    linkedList.removeBetween(nodeList[ 1 ], nodeList[ length - 1 ])
    doSanityTest(linkedList, 1)
    it(`should has head.next === ${nodeList[ 0 ].value}`, () => strictEqual(linkedList.getHead().next, nodeList[ 0 ]))
    it(`should has tail.prev === ${nodeList[ 0 ].value}`, () => strictEqual(linkedList.getTail().prev, nodeList[ 0 ]))
  })

  describe('LinkedList.reverse', () => {
    const { linkedList, nodeList, length } = getTestData()
    linkedList.reverse()
    doSanityTest(linkedList, length)
    linkedList.forEach((node, index) => it(
      `should has node.value === ${nodeList[ (length - 1) - index ].value}`,
      () => strictEqual(node.value, nodeList[ (length - 1) - index ].value)
    ))
  })

  describe('LinkedList.moveToFirst', () => {
    const { linkedList, nodeList } = getTestData(5)
    linkedList.moveToFirst(nodeList[ 3 ])
    doSanityTest(linkedList, 5)
    it(`should has head.next === ${nodeList[ 3 ].value}`, () => strictEqual(linkedList.getHead().next, nodeList[ 3 ]))
    it(`should has tail.prev.prev === ${nodeList[ 2 ].value}`, () => strictEqual(linkedList.getTail().prev.prev, nodeList[ 2 ]))
  })

  describe('LinkedList.moveToLast', () => {
    const { linkedList, nodeList } = getTestData(5)
    linkedList.moveToLast(nodeList[ 1 ])
    doSanityTest(linkedList, 5)
    it(`should has tail.prev === ${nodeList[ 1 ].value}`, () => strictEqual(linkedList.getTail().prev, nodeList[ 1 ]))
    it(`should has head.next.next === ${nodeList[ 2 ].value}`, () => strictEqual(linkedList.getHead().next.next, nodeList[ 2 ]))
  })

  describe('LinkedList stress test', () => {
    const { linkedList } = getTestData(0xff)

    const pickRandomNode = () => {
      let index = getRandomInt(0, linkedList.getLength() - 1)
      let node = linkedList.getHead().next
      while (index !== 0) {
        node = node.next
        index--
      }
      return node
    }

    const operationList = [
      [ 'create some', () => { linkedList.unshift(createNode(getRandomId('n'))) } ],
      [ 'create some', () => { linkedList.unshift(createNode(getRandomId('n'))) } ], // for balance length
      [ 'drop some', () => { linkedList.getLength() !== 0 && linkedList.remove(pickRandomNode()) } ],
      [ 'drop the node before tail', () => { linkedList.getLength() !== 0 && linkedList.remove(linkedList.getTail().prev) } ],
      [ 'move node to first', () => { linkedList.getLength() !== 0 && linkedList.moveToFirst(pickRandomNode()) } ],
      [ 'move node to last', () => { linkedList.getLength() !== 0 && linkedList.moveToLast(pickRandomNode()) } ]
    ]
    const operationCount = operationList.length

    const head = linkedList.getHead()
    const tail = linkedList.getTail()
    const sanityCheck = (message) => {
      strictEqual(head, linkedList.getHead())
      strictEqual(tail, linkedList.getTail())
      strictEqual(head.prev, null)
      strictEqual(tail.next, null)

      const length = linkedList.getLength()
      const nodeList = []
      let prevNode = linkedList.getHead()
      try {
        linkedList.forEach((node, index) => {
          if (node.prev !== prevNode || prevNode.next !== node) {
            console.log('get node:', node.value, `node.prev:`, node.prev.value, `expect:`, prevNode.value)
            throw new Error(`[${message}] broken prev link`)
          }
          nodeList.push(node)
          prevNode = node
        })
      } catch (error) {
        console.log(`[Error|${message}]`, {
          length,
          nodeList: nodeList.map(({ value, prev, next }) => ({
            value,
            prvValue: prev ? prev.value : `bad: ${prev}`,
            nextValue: next ? next.value : `bad: ${next}`
          })),
          prevNodeValue: prevNode.value
        }, error)
        throw error
      }
    }

    let testLeft = __DEV__ ? 0xfffff : 0xffff
    it(`stress-test #${testLeft}`, () => {
      sanityCheck('start')
      while (testLeft !== 0) {
        info(`testLeft: ${testLeft}, linkedList length: ${linkedList.getLength()}`)
        const numberList = getRandomIntList(0, 0xffff, Math.min(0xfff, testLeft))
        for (const number of numberList) {
          const index = number % operationCount
          const [ title, func ] = operationList[ index ]
          // console.log({ title, linkedListLength: linkedList.getLength() })
          func()
          sanityCheck(title)
        }
        testLeft -= numberList.length
      }
    })
  })
})
