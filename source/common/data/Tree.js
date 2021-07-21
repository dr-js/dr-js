// NOTE: the search func can be used as walk/traverse, just not return true during search
// NOTE: the `initialNode` will not appear in search, only below node will

// TODO: support mark isBranch/isLeaf node?
// TODO: support return `const SKIP = Symbol('TREE:SKIP')` for:
//   - DFS/BFS: skip deeper node
//   - BUS: no support

const createTreeDepthFirstSearch = (getSubNodeListFunc) => { // ([ node, level, ... ], extra) => [ [ node, level + 1, ... ] ] // or return undefined to end branch
  const unshiftStack = (stack, node, extra) => {
    const nodeList = getSubNodeListFunc(node, extra)
    Array.isArray(nodeList) && stack.unshift(...nodeList)
  }
  return (
    initialNode, // [ initialNode, 0 ]
    func, // (node) => true/false // return true to end search
    extra // optional, some tree-like structure need to get subNodeList from extra outer data
  ) => {
    const stack = [] // [ node, node, ... ]
    unshiftStack(stack, initialNode, extra)
    let node
    while ((node = stack.shift())) {
      if (func(node)) return node
      unshiftStack(stack, node, extra)
    }
  }
}

const createTreeDepthFirstSearchAsync = (getSubNodeListFunc) => { // async ([ node, level, ... ], extra) => [ [ node, level + 1, ... ] ] // or return undefined to end branch
  const unshiftStackAsync = async (stack, node, extra) => {
    const nodeList = await getSubNodeListFunc(node, extra)
    Array.isArray(nodeList) && stack.unshift(...nodeList)
  }
  return async (
    initialNode, // [ initialNode, 0 ]
    func, // async (node) => true/false // return true to end search
    extra // optional, some tree-like structure need to get subNodeList from extra outer data
  ) => {
    const stack = [] // [ node, node, ... ]
    await unshiftStackAsync(stack, initialNode, extra)
    let node
    while ((node = stack.shift())) {
      if (await func(node)) return node
      await unshiftStackAsync(stack, node, extra)
    }
  }
}

const createTreeBreadthFirstSearch = (getSubNodeListFunc) => { // ([ node, level, ... ], extra) => [ [ node, level + 1, ... ] ] // or return undefined to end branch
  const pushStack = (stack, node, extra) => {
    const nodeList = getSubNodeListFunc(node, extra)
    Array.isArray(nodeList) && stack.push(...nodeList)
  }
  return (
    initialNode, // [ initialNode, 0 ]
    func, // (node) => true/false // return true to end search
    extra // optional, some tree-like structure need to get subNodeList from extra outer data
  ) => {
    const stack = []
    pushStack(stack, initialNode, extra)
    let node
    while ((node = stack.shift())) {
      if (func(node)) return node
      pushStack(stack, node, extra)
    }
  }
}

const createTreeBreadthFirstSearchAsync = (getSubNodeListFunc) => { // async ([ node, level, ... ], extra) => [ [ node, level + 1, ... ] ] // or return undefined to end branch
  const pushStackAsync = async (stack, node, extra) => {
    const nodeList = await getSubNodeListFunc(node, extra)
    Array.isArray(nodeList) && stack.push(...nodeList)
  }
  return async (
    initialNode, // [ initialNode, 0 ]
    func, // async (node) => true/false // return true to end search
    extra // optional, some tree-like structure need to get subNodeList from extra outer data
  ) => {
    const stack = [] // [ node, node, ... ]
    await pushStackAsync(stack, initialNode, extra)
    let node
    while ((node = stack.shift())) {
      if (await func(node)) return node
      await pushStackAsync(stack, node, extra)
    }
  }
}

const createTreeBottomUpSearch = (getSubNodeListFunc) => { // ([ node, level, ... ], extra) => [ [ node, level + 1, ... ] ] // or return undefined to end branch
  const pushPairStack = (pairStack, node, extra) => {
    const nodeList = getSubNodeListFunc(node, extra)
    return Boolean(Array.isArray(nodeList) && pairStack.push([ node, nodeList ])) // has subNodeList
  }
  return (
    initialNode, // [ initialNode, 0 ]
    func, // (node) => true/false // return true to end search
    extra // optional, some tree-like structure need to get subNodeList from extra outer data
  ) => {
    const pairStack = [] // [ [ node, subNodeList ], [ node, subNodeList ], ... ]
    pushPairStack(pairStack, initialNode, extra)
    while (pairStack.length !== 0) {
      const [ node, subNodeList ] = pairStack[ pairStack.length - 1 ]
      if (subNodeList.length === 0) {
        pairStack.pop()
        if (pairStack.length !== 0 && func(node)) return node // skip initial node
      } else {
        const subNode = subNodeList.shift()
        const hasSubNodeList = pushPairStack(pairStack, subNode, extra)
        if (!hasSubNodeList && func(subNode)) return subNode
      }
    }
  }
}

const createTreeBottomUpSearchAsync = (getSubNodeListFunc) => { // async ([ node, level, ... ], extra) => [ [ node, level + 1, ... ] ] // or return undefined to end branch
  const pushPairStackAsync = async (pairStack, node, extra) => {
    const nodeList = await getSubNodeListFunc(node, extra)
    return Boolean(Array.isArray(nodeList) && pairStack.push([ node, nodeList ])) // has subNodeList
  }
  return async (
    initialNode, // [ initialNode, 0 ]
    func, // async (node) => true/false // return true to end search
    extra // optional, some tree-like structure need to get subNodeList from extra outer data
  ) => {
    const pairStack = [] // [ [ node, subNodeList ], [ node, subNodeList ], ... ]
    await pushPairStackAsync(pairStack, initialNode, extra)
    while (pairStack.length !== 0) {
      const [ node, subNodeList ] = pairStack[ pairStack.length - 1 ]
      if (subNodeList.length === 0) {
        pairStack.pop()
        if (pairStack.length !== 0 && await func(node)) return node // skip initial node
      } else {
        const subNode = subNodeList.shift()
        const hasSubNodeList = await pushPairStackAsync(pairStack, subNode, extra)
        if (!hasSubNodeList && await func(subNode)) return subNode
      }
    }
  }
}

const prettyStringifyTreeNode = (
  getSubNodeLevelHasMoreListFunc, // ([ node, level, hasMore ], extra) => [ [ subNode, level + 1, subIndex !== length - 1 ] ]
  initialNode, // [ initialNode, -1, false ]
  func, // (prefix, node) => resultList.push(`${prefix}${node}`)
  extra // optional, some tree-like structure need to get subNodeList from extra outer data
) => {
  const studList = []
  createTreeDepthFirstSearch(getSubNodeLevelHasMoreListFunc)(
    initialNode, // [ initialNode, -1, false ]
    ([ node, level, hasMore ]) => { // NOTE: hasMore = has more sibling-node
      studList.length = level
      if (level !== 0) studList[ level - 1 ] = hasMore ? '├─ ' : '└─ '
      func(studList.join(''), node)
      if (level !== 0) studList[ level - 1 ] = hasMore ? '│  ' : '   '
    },
    extra
  )
}

export {
  createTreeDepthFirstSearch,
  createTreeDepthFirstSearchAsync,

  createTreeBreadthFirstSearch,
  createTreeBreadthFirstSearchAsync,

  createTreeBottomUpSearch,
  createTreeBottomUpSearchAsync,

  prettyStringifyTreeNode
}
