// LinkedList
// has many: Node
// each contains: value

class DoublyLinkedList {
  static createNode = (value, prev = null, next = null) => ({ value, prev, next })

  constructor () {
    this.clear()
  }

  get length () { return this.nodeSet.size }

  clear () {
    this.head = DoublyLinkedList.createNode(null)
    this.tail = DoublyLinkedList.createNode(null)

    this.head.next = this.tail
    this.tail.prev = this.head

    this.nodeSet = new Set()
  }

  insertAfter (node, prevNode) {
    if (__DEV__ && this.nodeSet.has(node)) throw new Error('[DoublyLinkedList][insertAfter] already has node')
    if (__DEV__ && prevNode !== this.head && !this.nodeSet.has(prevNode)) throw new Error('[DoublyLinkedList][insertAfter] invalid prevNode')
    const { next } = prevNode
    prevNode.next = node
    next.prev = node
    node.prev = prevNode
    node.next = next
    this.nodeSet.add(node)
  }

  insertBefore (node, nextNode) {
    if (__DEV__ && this.nodeSet.has(node)) throw new Error('[DoublyLinkedList][insertBefore] already has node')
    if (__DEV__ && nextNode !== this.tail && !this.nodeSet.has(nextNode)) throw new Error('[DoublyLinkedList][insertBefore] invalid nextNode')
    const { prev } = nextNode
    nextNode.prev = node
    prev.next = node
    node.prev = prev
    node.next = nextNode
    this.nodeSet.add(node)
  }

  remove (node) {
    if (__DEV__ && !this.nodeSet.has(node)) throw new Error('[DoublyLinkedList][remove] invalid node')
    const { prev, next } = node
    prev.next = next
    next.prev = prev
    node.prev = null
    node.next = null
    this.nodeSet.delete(node)
  }

  removeBetween (fromNode, toNode) { // include both from & to node
    if (__DEV__ && !this.nodeSet.has(fromNode)) throw new Error('[DoublyLinkedList][removeBetween] invalid fromNode')
    if (__DEV__ && !this.nodeSet.has(toNode)) throw new Error('[DoublyLinkedList][removeBetween] invalid toNode')
    const { prev } = fromNode
    const { next } = toNode
    prev.next = next
    next.prev = prev
    fromNode.prev = null
    toNode.next = null
    let node = fromNode
    while (node) {
      this.nodeSet.delete(node)
      node = node.next
    }
  }

  forEach (callback, thisArg = this) {
    let node = this.head.next
    let index = 0
    while (node !== this.tail) {
      callback(node, index)
      callback.call(thisArg, node, index, this)
      node = node.next
      index++
    }
  }

  forEachReverse (callback, thisArg = this) { // the index starts from length - 1
    let node = this.tail.prev
    let index = this.length - 1
    while (node !== this.head) {
      callback(node, index)
      callback.call(thisArg, node, index, this)
      node = node.prev
      index--
    }
  }

  reverse () {
    let node = this.head.next
    while (node !== this.tail) {
      const { prev, next } = node
      node.prev = next
      node.next = prev
      node = next
    }
    const { next } = this.head
    const { prev } = this.tail
    this.head.next = prev
    this.tail.prev = next
    prev.prev = this.head
    next.next = this.tail
  }

  setFirst (node) {
    if (__DEV__ && !this.nodeSet.has(node)) throw new Error('[DoublyLinkedList][setFirst] invalid node')
    if (node === this.head.next) return
    // pick
    const { prev, next } = node
    prev.next = next
    next.prev = prev
    // set
    node.prev = this.head
    node.next = this.head.next
    this.head.next = node
  }

  setLast (node) {
    if (__DEV__ && !this.nodeSet.has(node)) throw new Error('[DoublyLinkedList][setLast] invalid node')
    if (node === this.tail.prev) return
    // pick
    const { prev, next } = node
    prev.next = next
    next.prev = prev
    // set
    node.prev = this.tail.prev
    node.next = this.tail
    this.tail.prev = node
  }

  push (node) { return this.insertBefore(node, this.tail) }

  pop () { return this.remove(this.tail.prev) }

  unshift (node) { return this.insertAfter(node, this.head) }

  shift () { return this.remove(this.head.next) }
}

export {
  DoublyLinkedList
}
