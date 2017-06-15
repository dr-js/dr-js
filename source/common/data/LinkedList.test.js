import nodeModuleAssert from 'assert'
import { DoublyLinkedList } from './LinkedList'

const { describe, it } = global
global.__DEV__ = false

function getTestData () {
  const linkedList = new DoublyLinkedList()
  const nodeList = [ 0, 1, 2, 3, 4 ].map((index) => {
    const node = DoublyLinkedList.createNode(`Node${index}`)
    linkedList.push(node)
    return node
  })
  return { linkedList, nodeList }
}

function doSanityTest (linkedList, length) {
  it('should has head.prev === null', () => nodeModuleAssert.equal(linkedList.head.prev, null))
  it('should has tail.next === null', () => nodeModuleAssert.equal(linkedList.tail.next, null))
  it(`should has length === ${length}`, () => nodeModuleAssert.equal(linkedList.length, length))
}

describe('LinkedList', () => {
  const linkedList = new DoublyLinkedList()
  doSanityTest(linkedList, 0)
})

describe('LinkedList.forEach', () => {
  const { linkedList, nodeList } = getTestData()
  doSanityTest(linkedList, 5)
  linkedList.forEach((node, index) => it(`should has node.value === ${nodeList[ index ].value}`, () => nodeModuleAssert.equal(node.value, nodeList[ index ].value)))
})

describe('LinkedList.remove', () => {
  const { linkedList, nodeList } = getTestData()
  linkedList.remove(nodeList[ 1 ])
  linkedList.remove(nodeList[ 4 ])
  doSanityTest(linkedList, 3)
})

describe('LinkedList.removeBetween', () => {
  const { linkedList, nodeList } = getTestData()
  linkedList.removeBetween(nodeList[ 1 ], nodeList[ 4 ])
  doSanityTest(linkedList, 1)
  it(`should has head.next === ${nodeList[ 0 ].value}`, () => nodeModuleAssert.equal(linkedList.head.next, nodeList[ 0 ]))
  it(`should has tail.prev === ${nodeList[ 0 ].value}`, () => nodeModuleAssert.equal(linkedList.tail.prev, nodeList[ 0 ]))
})

describe('LinkedList.reverse', () => {
  const { linkedList, nodeList } = getTestData()
  linkedList.reverse()
  doSanityTest(linkedList, 5)
  linkedList.forEach((node, index) => it(`should has node.value === ${nodeList[ 4 - index ].value}`, () => nodeModuleAssert.equal(node.value, nodeList[ 4 - index ].value)))
})

describe('LinkedList.setFirst', () => {
  const { linkedList, nodeList } = getTestData()
  linkedList.setFirst(nodeList[ 3 ])
  doSanityTest(linkedList, 5)
  it(`should has head.next === ${nodeList[ 3 ].value}`, () => nodeModuleAssert.equal(linkedList.head.next, nodeList[ 3 ]))
  it(`should has tail.prev.prev === ${nodeList[ 2 ].value}`, () => nodeModuleAssert.equal(linkedList.tail.prev.prev, nodeList[ 2 ]))
})

describe('LinkedList.setLast', () => {
  const { linkedList, nodeList } = getTestData()
  linkedList.setLast(nodeList[ 1 ])
  doSanityTest(linkedList, 5)
  it(`should has tail.prev === ${nodeList[ 1 ].value}`, () => nodeModuleAssert.equal(linkedList.tail.prev, nodeList[ 1 ]))
  it(`should has head.next.next === ${nodeList[ 2 ].value}`, () => nodeModuleAssert.equal(linkedList.head.next.next, nodeList[ 2 ]))
})
