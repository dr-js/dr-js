import { strictEqual } from 'source/common/verify'
import { createDoublyLinkedList, createNode } from './LinkedList'

const { describe, it } = global

const getTestData = () => {
  const linkedList = createDoublyLinkedList()
  const nodeList = [ 0, 1, 2, 3, 4 ].map((index) => {
    const node = createNode(`Node${index}`)
    linkedList.push(node)
    return node
  })
  return { linkedList, nodeList }
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
    const { linkedList, nodeList } = getTestData()
    doSanityTest(linkedList, 5)
    linkedList.forEach((node, index) => it(`should has node.value === ${nodeList[ index ].value}`, () => strictEqual(node.value, nodeList[ index ].value)))
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
    it(`should has head.next === ${nodeList[ 0 ].value}`, () => strictEqual(linkedList.getHead().next, nodeList[ 0 ]))
    it(`should has tail.prev === ${nodeList[ 0 ].value}`, () => strictEqual(linkedList.getTail().prev, nodeList[ 0 ]))
  })

  describe('LinkedList.reverse', () => {
    const { linkedList, nodeList } = getTestData()
    linkedList.reverse()
    doSanityTest(linkedList, 5)
    linkedList.forEach((node, index) => it(`should has node.value === ${nodeList[ 4 - index ].value}`, () => strictEqual(node.value, nodeList[ 4 - index ].value)))
  })

  describe('LinkedList.setFirst', () => {
    const { linkedList, nodeList } = getTestData()
    linkedList.setFirst(nodeList[ 3 ])
    doSanityTest(linkedList, 5)
    it(`should has head.next === ${nodeList[ 3 ].value}`, () => strictEqual(linkedList.getHead().next, nodeList[ 3 ]))
    it(`should has tail.prev.prev === ${nodeList[ 2 ].value}`, () => strictEqual(linkedList.getTail().prev.prev, nodeList[ 2 ]))
  })

  describe('LinkedList.setLast', () => {
    const { linkedList, nodeList } = getTestData()
    linkedList.setLast(nodeList[ 1 ])
    doSanityTest(linkedList, 5)
    it(`should has tail.prev === ${nodeList[ 1 ].value}`, () => strictEqual(linkedList.getTail().prev, nodeList[ 1 ]))
    it(`should has head.next.next === ${nodeList[ 2 ].value}`, () => strictEqual(linkedList.getHead().next.next, nodeList[ 2 ]))
  })
})
