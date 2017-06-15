import { getRandomId } from'source/common/math'

export class TreeNode {
  constructor (id) {
    this.id = id || getRandomId()
    this.parent = null
    this.children = []
  }

  isLeaf () {
    return this.children.length === 0
  }

  setParent (node) {
    this.parent = node

    this.onChangeParentCallback()
  }

  addChild (node) {
    if (this.children[ node.id ]) throw new Error('[TreeNode][addChild] duplicate node id')

    this.children[ node.id ] = node
    node.setParent(this)

    this.onChangeChildCallback()
  }

  removeChildById (id) {
    const node = this.children[ id ]
    if (node) {
      node.setParent(null)
      this.children[ id ] = null

      this.onChangeChildCallback()
    }
    return node
  }

  removeChildByProperty (key, value) {
    for (const id in this.children) {
      if (this.children[ id ][ key ] === value) {
        this.removeChildById(id)
        // break; // will not break for multi remove
      }
    }
  }

  removeFromParent () {
    if (this.parent) {
      return this.parent.removeChildById(this.id)
    }
  }

  traverseDown (func) {
    func(this) // self included
    for (const id in this.children) {
      this.children[ id ].traverseDown(func)
    }
  }

  traverseDownBubble (func) {
    for (const id in this.children) {
      this.children[ id ].traverseDownBubble(func)
    }
    func(this) // self included
  }

  traverseUp (func) {
    if (this.parent) {
      this.parent.traverseUp(func)
      func(this.parent) // self not included
    }
  }

  traverseUpBubble (func) {
    if (this.parent) {
      func(this.parent) // self not included
      this.parent.traverseUpBubble(func)
    }
  }

  traverseDirectChild (func) {
    for (const id in this.children) {
      func(this.children[ id ])
    }
  }

  onChangeParentCallback () {}

  onChangeChildCallback () {}
}
