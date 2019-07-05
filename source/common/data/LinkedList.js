// LinkedList
//   head { value: null, prev: null, next }
//   node { value, prev, next } index = 0
//   node { value, prev, next } index = 1
//   ...
//   node { value, prev, next } index = length - 1
//   tail { value: null, prev, next: null }

const createNode = (value, prev = null, next = null) => ({ value, prev, next })

const isFreeNode = ({ prev, next }) => prev === null && next === null
const isLinkNode = ({ prev, next }) => prev !== null && next !== null
// const isLinkHead = ({ prev, next }) => prev === null && next !== null
// const isLinkTail = ({ prev, next }) => prev !== null && next === null

const createDoublyLinkedList = () => {
  let devNodeSet // only in dev mode
  let head, tail, length
  const clear = () => {
    if (__DEV__) devNodeSet = new Set()
    head = createNode(null)
    tail = createNode(null, head)
    head.next = tail
    length = 0
  }
  clear()

  const getHead = () => head
  const getTail = () => tail
  const getLength = () => __DEV__ ? devNodeSet.size : length // node count (do not count head/tail)
  const insertAfter = (node, prevNode) => {
    if (__DEV__ && devNodeSet.has(node)) throw new Error('[DoublyLinkedList][insertAfter] already has node')
    if (__DEV__ && !isFreeNode(node)) throw new Error('[DoublyLinkedList][insertAfter] invalid node')
    if (__DEV__ && prevNode !== head && !devNodeSet.has(prevNode)) throw new Error('[DoublyLinkedList][insertAfter] invalid prevNode')
    const { next } = prevNode
    node.prev = prevNode
    node.next = next
    prevNode.next = next.prev = node
    length++
    __DEV__ && devNodeSet.add(node)
  }
  const insertBefore = (node, nextNode) => {
    if (__DEV__ && devNodeSet.has(node)) throw new Error('[DoublyLinkedList][insertBefore] already has node')
    if (__DEV__ && !isFreeNode(node)) throw new Error('[DoublyLinkedList][insertAfter] invalid node')
    if (__DEV__ && nextNode !== tail && !devNodeSet.has(nextNode)) throw new Error('[DoublyLinkedList][insertBefore] invalid nextNode')
    const { prev } = nextNode
    node.prev = prev
    node.next = nextNode
    nextNode.prev = prev.next = node
    length++
    __DEV__ && devNodeSet.add(node)
  }
  const remove = (node) => {
    if (__DEV__ && !devNodeSet.has(node)) throw new Error('[DoublyLinkedList][remove] missing node')
    if (__DEV__ && !isLinkNode(node)) throw new Error('[DoublyLinkedList][remove] invalid node')
    const { prev, next } = node
    prev.next = next
    next.prev = prev
    node.prev = node.next = null
    length--
    __DEV__ && devNodeSet.delete(node)
  }
  const removeBetween = (fromNode, toNode) => { // include both from & to node
    if (__DEV__ && !devNodeSet.has(fromNode)) throw new Error('[DoublyLinkedList][removeBetween] missing fromNode')
    if (__DEV__ && !isLinkNode(fromNode)) throw new Error('[DoublyLinkedList][removeBetween] invalid fromNode')
    if (__DEV__ && !devNodeSet.has(toNode)) throw new Error('[DoublyLinkedList][removeBetween] missing toNode')
    if (__DEV__ && !isLinkNode(toNode)) throw new Error('[DoublyLinkedList][removeBetween] invalid toNode')
    const { prev } = fromNode
    const { next } = toNode
    prev.next = next
    next.prev = prev
    fromNode.prev = toNode.next = null
    let node = fromNode
    while (node) {
      length--
      __DEV__ && devNodeSet.delete(node)
      node = node.next
    }
  }
  const forEach = (callback) => { // index from 0, node from head to tail (do not count head/tail)
    let node = head.next
    let index = 0
    while (node !== tail) {
      if (__DEV__ && !isLinkNode(node)) throw new Error('[DoublyLinkedList][forEach] invalid node')
      callback(node, index)
      node = node.next
      index++
    }
  }
  const forEachReverse = (callback) => { // index from length - 1, node from tail to head (do not count head/tail)
    let node = tail.prev
    let index = __DEV__ ? devNodeSet.size - 1 : length - 1
    while (node !== head) {
      if (__DEV__ && !isLinkNode(node)) throw new Error('[DoublyLinkedList][forEachReverse] invalid node')
      callback(node, index)
      node = node.prev
      index--
    }
  }
  const reverse = () => {
    let node = head.next
    while (node !== tail) {
      if (__DEV__ && !isLinkNode(node)) throw new Error('[DoublyLinkedList][reverse] invalid node')
      const { prev, next } = node
      node.prev = next
      node.next = prev
      node = next
    }
    const { next } = head
    const { prev } = tail
    head.next = prev
    tail.prev = next
    prev.prev = head
    next.next = tail
  }
  const moveToFirst = (node) => {
    if (__DEV__ && !devNodeSet.has(node)) throw new Error('[DoublyLinkedList][moveToFirst] missing node')
    if (__DEV__ && !isLinkNode(node)) throw new Error('[DoublyLinkedList][moveToFirst] invalid node')
    if (node === head.next) return
    // pick
    const { prev, next } = node
    prev.next = next
    next.prev = prev
    // set
    node.prev = head
    node.next = head.next
    node.next.prev = head.next = node
  }
  const moveToLast = (node) => {
    if (__DEV__ && !devNodeSet.has(node)) throw new Error('[DoublyLinkedList][moveToLast] missing node')
    if (__DEV__ && !isLinkNode(node)) throw new Error('[DoublyLinkedList][moveToLast] invalid node')
    if (node === tail.prev) return
    // pick
    const { prev, next } = node
    prev.next = next
    next.prev = prev
    // set
    node.next = tail
    node.prev = tail.prev
    node.prev.next = tail.prev = node
  }

  return {
    clear,
    getHead,
    getTail,
    getLength,
    insertAfter,
    insertBefore,
    remove,
    removeBetween,
    forEach,
    forEachReverse,
    reverse,
    moveToFirst,
    moveToLast,

    push: (node) => insertBefore(node, tail),
    pop: () => remove(tail.prev),
    unshift: (node) => insertAfter(node, head),
    shift: () => remove(head.next)
  }
}

export {
  createNode,
  createDoublyLinkedList
}
