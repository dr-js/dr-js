// NOTE: the search func can be used as walk/traverse, just not return true during search
// NOTE: the `initialNode` will not appear in search, only below node will

const SEARCH_END = Symbol('TREE:SEARCH-END') // end and return current node, all support: DFS/BFS/BUS
const SEARCH_SKIP = Symbol('TREE:SEARCH-SKIP') // skip branch below current node, support: DFS/BFS, not support: BUS

const createTree2DepthFirstSearch = (getSubNodeListFunc) => { // ([ node, level, ... ], extra) => [ [ node, level + 1, ... ] ] // or return undefined to end branch
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
      const output = func(node)
      if (output === SEARCH_END) return node
      if (output === SEARCH_SKIP) continue
      unshiftStack(stack, node, extra)
    }
  }
}

const createTree2DepthFirstSearchAsync = (getSubNodeListFunc) => { // async ([ node, level, ... ], extra) => [ [ node, level + 1, ... ] ] // or return undefined to end branch
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
      const output = await func(node)
      if (output === SEARCH_END) return node
      if (output === SEARCH_SKIP) continue
      await unshiftStackAsync(stack, node, extra)
    }
  }
}

const createTree2BreadthFirstSearch = (getSubNodeListFunc) => { // ([ node, level, ... ], extra) => [ [ node, level + 1, ... ] ] // or return undefined to end branch
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
      const output = func(node)
      if (output === SEARCH_END) return node
      if (output === SEARCH_SKIP) continue
      pushStack(stack, node, extra)
    }
  }
}

const createTree2BreadthFirstSearchAsync = (getSubNodeListFunc) => { // async ([ node, level, ... ], extra) => [ [ node, level + 1, ... ] ] // or return undefined to end branch
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
      const output = await func(node)
      if (output === SEARCH_END) return node
      if (output === SEARCH_SKIP) continue
      await pushStackAsync(stack, node, extra)
    }
  }
}

const createTree2BottomUpSearch = (getSubNodeListFunc) => { // ([ node, level, ... ], extra) => [ [ node, level + 1, ... ] ] // or return undefined to end branch
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
        if (pairStack.length !== 0 && (func(node) === SEARCH_END)) return node // skip initial node
      } else {
        const subNode = subNodeList.shift()
        const hasSubNodeList = pushPairStack(pairStack, subNode, extra)
        if (!hasSubNodeList && (func(subNode) === SEARCH_END)) return subNode
      }
    }
  }
}

const createTree2BottomUpSearchAsync = (getSubNodeListFunc) => { // async ([ node, level, ... ], extra) => [ [ node, level + 1, ... ] ] // or return undefined to end branch
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
        if (pairStack.length !== 0 && (await func(node) === SEARCH_END)) return node // skip initial node
      } else {
        const subNode = subNodeList.shift()
        const hasSubNodeList = await pushPairStackAsync(pairStack, subNode, extra)
        if (!hasSubNodeList && (await func(subNode) === SEARCH_END)) return subNode
      }
    }
  }
}

const prettyStringifyTree2Node = (
  getSubNodeLevelHasMoreListFunc, // ([ node, level, hasMore ], extra) => [ [ subNode, level + 1, subIndex !== length - 1 ] ]
  initialNode, // [ initialNode, -1, false ]
  func, // (prefix, node) => resultList.push(`${prefix}${node}`)
  extra // optional, some tree-like structure need to get subNodeList from extra outer data
) => {
  const studList = []
  createTree2DepthFirstSearch(getSubNodeLevelHasMoreListFunc)(
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
  SEARCH_END,
  SEARCH_SKIP,

  createTree2DepthFirstSearch,
  createTree2DepthFirstSearchAsync,

  createTree2BreadthFirstSearch,
  createTree2BreadthFirstSearchAsync,

  createTree2BottomUpSearch,
  createTree2BottomUpSearchAsync,

  prettyStringifyTree2Node
}
