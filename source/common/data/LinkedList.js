// LinkedList
// has many: Node
// each contains: value

const createDoublyLinkedList = () => {
  let devNodeSet
  let head, tail, length
  const clear = () => {
    if (__DEV__) devNodeSet = new Set()
    head = createNode(null)
    tail = createNode(null)
    head.next = tail
    tail.prev = head
    length = 0
  }
  clear()

  const getHead = () => head
  const getTail = () => tail
  const getLength = () => __DEV__ ? devNodeSet.size : length
  const getNode = (index) => { // should avoid in performance related code
    if (__DEV__ && (index < 0 || index > length - 1)) throw new Error(`[DoublyLinkedList][getNode] invalid index: ${index}`)
    let node = head.next
    index = Math.min(index, length - 1)
    while (index !== 0) {
      node = node.next
      index--
    }
    return node
  }
  const insertAfter = (node, prevNode) => {
    if (__DEV__ && devNodeSet.has(node)) throw new Error('[DoublyLinkedList][insertAfter] already has node')
    if (__DEV__ && !isFreeNode(node)) throw new Error('[DoublyLinkedList][insertAfter] invalid node')
    if (__DEV__ && prevNode !== head && !devNodeSet.has(prevNode)) throw new Error('[DoublyLinkedList][insertAfter] invalid prevNode')
    const { next } = prevNode
    prevNode.next = next.prev = node
    node.prev = prevNode
    node.next = next
    length++
    __DEV__ && devNodeSet.add(node)
  }
  const insertBefore = (node, nextNode) => {
    if (__DEV__ && devNodeSet.has(node)) throw new Error('[DoublyLinkedList][insertBefore] already has node')
    if (__DEV__ && !isFreeNode(node)) throw new Error('[DoublyLinkedList][insertAfter] invalid node')
    if (__DEV__ && nextNode !== tail && !devNodeSet.has(nextNode)) throw new Error('[DoublyLinkedList][insertBefore] invalid nextNode')
    const { prev } = nextNode
    nextNode.prev = prev.next = node
    node.prev = prev
    node.next = nextNode
    length++
    __DEV__ && devNodeSet.add(node)
  }
  const remove = (node) => { // TODO: rename to `delete`?
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
  const forEach = (callback) => {
    let node = head.next
    let index = 0
    while (node !== tail) {
      if (__DEV__ && !isLinkNode(node)) throw new Error('[DoublyLinkedList][forEach] invalid node')
      callback(node, index)
      node = node.next
      index++
    }
  }
  const forEachReverse = (callback) => { // the index starts from length - 1
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
  const setFirst = (node) => {
    if (__DEV__ && !devNodeSet.has(node)) throw new Error('[DoublyLinkedList][setFirst] missing node')
    if (__DEV__ && !isLinkNode(node)) throw new Error('[DoublyLinkedList][setFirst] invalid node')
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
  const setLast = (node) => {
    if (__DEV__ && !devNodeSet.has(node)) throw new Error('[DoublyLinkedList][setLast] missing node')
    if (__DEV__ && !isLinkNode(node)) throw new Error('[DoublyLinkedList][setLast] invalid node')
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
    getNode,
    insertAfter,
    insertBefore,
    remove,
    removeBetween,
    forEach,
    forEachReverse,
    reverse,
    setFirst,
    setLast,
    push: (node) => insertBefore(node, tail),
    pop: () => remove(tail.prev),
    unshift: (node) => insertAfter(node, head),
    shift: () => remove(head.next)
  }
}

const createNode = (value, prev = null, next = null) => ({ value, prev, next })

const isFreeNode = ({ prev, next }) => prev === null && next === null
const isLinkNode = ({ prev, next }) => prev !== null && next !== null

export {
  createDoublyLinkedList,
  createNode
}
