// LinkedList
// has many: Node
// each contains: value

const createNode = (value, prev = null, next = null) => ({ value, prev, next })
const createDoublyLinkedList = () => {
  let nodeSet, head, tail
  const clear = () => {
    nodeSet = new Set()
    head = createNode(null)
    tail = createNode(null)
    head.next = tail
    tail.prev = head
  }
  clear()

  const getHead = () => head
  const getTail = () => tail
  const getLength = () => nodeSet.size
  const insertAfter = (node, prevNode) => {
    if (__DEV__ && nodeSet.has(node)) throw new Error('[DoublyLinkedList][insertAfter] already has node')
    if (__DEV__ && prevNode !== head && !nodeSet.has(prevNode)) throw new Error('[DoublyLinkedList][insertAfter] invalid prevNode')
    const { next } = prevNode
    prevNode.next = next.prev = node
    node.prev = prevNode
    node.next = next
    nodeSet.add(node)
  }
  const insertBefore = (node, nextNode) => {
    if (__DEV__ && nodeSet.has(node)) throw new Error('[DoublyLinkedList][insertBefore] already has node')
    if (__DEV__ && nextNode !== tail && !nodeSet.has(nextNode)) throw new Error('[DoublyLinkedList][insertBefore] invalid nextNode')
    const { prev } = nextNode
    nextNode.prev = prev.next = node
    node.prev = prev
    node.next = nextNode
    nodeSet.add(node)
  }
  const remove = (node) => {
    if (__DEV__ && !nodeSet.has(node)) throw new Error('[DoublyLinkedList][remove] invalid node')
    const { prev, next } = node
    prev.next = next
    next.prev = prev
    node.prev = node.next = null
    nodeSet.delete(node)
  }
  const removeBetween = (fromNode, toNode) => { // include both from & to node
    if (__DEV__ && !nodeSet.has(fromNode)) throw new Error('[DoublyLinkedList][removeBetween] invalid fromNode')
    if (__DEV__ && !nodeSet.has(toNode)) throw new Error('[DoublyLinkedList][removeBetween] invalid toNode')
    const { prev } = fromNode
    const { next } = toNode
    prev.next = next
    next.prev = prev
    fromNode.prev = toNode.next = null
    let node = fromNode
    while (node) {
      nodeSet.delete(node)
      node = node.next
    }
  }
  const forEach = (callback) => {
    let node = head.next
    let index = 0
    while (node !== tail) {
      callback(node, index)
      node = node.next
      index++
    }
  }
  const forEachReverse = (callback) => { // the index starts from length - 1
    let node = tail.prev
    let index = nodeSet.size - 1
    while (node !== head) {
      callback(node, index)
      node = node.prev
      index--
    }
  }
  const reverse = () => {
    let node = head.next
    while (node !== tail) {
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
    if (__DEV__ && !nodeSet.has(node)) throw new Error('[DoublyLinkedList][setFirst] invalid node')
    if (node === head.next) return
    // pick
    const { prev, next } = node
    prev.next = next
    next.prev = prev
    // set
    node.prev = head
    node.next = head.next
    head.next = node
  }
  const setLast = (node) => {
    if (__DEV__ && !nodeSet.has(node)) throw new Error('[DoublyLinkedList][setLast] invalid node')
    if (node === tail.prev) return
    // pick
    const { prev, next } = node
    prev.next = next
    next.prev = prev
    // set
    node.prev = tail.prev
    node.next = tail
    tail.prev = node
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
    setFirst,
    setLast,
    push: (node) => insertBefore(node, tail),
    pop: () => remove(tail.prev),
    unshift: (node) => insertAfter(node, head),
    shift: () => remove(head.next)
  }
}

export {
  createDoublyLinkedList,
  createNode
}
