// NOTE: the search func can be used as walk/traverse, just not return true during search
// NOTE: the initialNode will not appear in search, only below node will

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
    let node
    const stack = []
    unshiftStack(stack, initialNode, extra)
    while ((node = stack.shift())) {
      if (func(node)) return node
      unshiftStack(stack, node, extra)
    }
  }
}

const createTreeDepthFirstSearchAsync = (getSubNodeListFunc) => { // async ([ node, level, ... ], extra) => [ [ node, level + 1, ... ] ] // or return undefined to end branch
  const unshiftStack = async (stack, node, extra) => {
    const nodeList = await getSubNodeListFunc(node, extra)
    Array.isArray(nodeList) && stack.unshift(...nodeList)
  }
  return async (
    initialNode, // [ initialNode, 0 ]
    func, // async (node) => true/false // return true to end search
    extra // optional, some tree-like structure need to get subNodeList from extra outer data
  ) => {
    let node
    const stack = []
    await unshiftStack(stack, initialNode, extra)
    while ((node = stack.shift())) {
      if (await func(node)) return node
      await unshiftStack(stack, node, extra)
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
    let node
    const stack = []
    pushStack(stack, initialNode, extra)
    while ((node = stack.shift())) {
      if (func(node)) return node
      pushStack(stack, node, extra)
    }
  }
}

const createTreeBreadthFirstSearchAsync = (getSubNodeListFunc) => { // async ([ node, level, ... ], extra) => [ [ node, level + 1, ... ] ] // or return undefined to end branch
  const pushStack = async (stack, node, extra) => {
    const nodeList = await getSubNodeListFunc(node, extra)
    Array.isArray(nodeList) && stack.push(...nodeList)
  }
  return async (
    initialNode, // [ initialNode, 0 ]
    func, // async (node) => true/false // return true to end search
    extra // optional, some tree-like structure need to get subNodeList from extra outer data
  ) => {
    let node
    const stack = []
    await pushStack(stack, initialNode, extra)
    while ((node = stack.shift())) {
      if (await func(node)) return node
      await pushStack(stack, node, extra)
    }
  }
}

const createTreeBottomUpSearch = (getSubNodeListFunc) => { // ([ node, level, ... ], extra) => [ [ node, level + 1, ... ] ] // or return undefined to end branch
  const pushStack = (stack, node, extra) => {
    const nodeList = getSubNodeListFunc(node, extra)
    return Boolean(Array.isArray(nodeList) && stack.push([ node, nodeList ])) // has subNodeList
  }
  return (
    initialNode, // [ initialNode, 0 ]
    func, // (node) => true/false // return true to end search
    extra // optional, some tree-like structure need to get subNodeList from extra outer data
  ) => {
    const stack = [] // [ node, subNodeList ]
    pushStack(stack, initialNode, extra)
    while (stack.length !== 0) {
      const [ node, subNodeList ] = stack[ stack.length - 1 ]
      if (subNodeList.length === 0) {
        stack.pop()
        if (stack.length !== 0 && func(node)) return node // skip initial node
      } else {
        const subNode = subNodeList.shift()
        const hasSubNodeList = pushStack(stack, subNode, extra)
        if (!hasSubNodeList && func(subNode)) return subNode
      }
    }
  }
}

const createTreeBottomUpSearchAsync = (getSubNodeListFunc) => { // async ([ node, level, ... ], extra) => [ [ node, level + 1, ... ] ] // or return undefined to end branch
  const pushStack = async (stack, node, extra) => {
    const nodeList = await getSubNodeListFunc(node, extra)
    return Boolean(Array.isArray(nodeList) && stack.push([ node, nodeList ])) // has subNodeList
  }
  return async (
    initialNode, // [ initialNode, 0 ]
    func, // async (node) => true/false // return true to end search
    extra // optional, some tree-like structure need to get subNodeList from extra outer data
  ) => {
    const stack = [] // [ node, subNodeList ]
    await pushStack(stack, initialNode, extra)
    while (stack.length !== 0) {
      const [ node, subNodeList ] = stack[ stack.length - 1 ]
      if (subNodeList.length === 0) {
        stack.pop()
        if (stack.length !== 0 && await func(node)) return node // skip initial node
      } else {
        const subNode = subNodeList.shift()
        const hasSubNodeList = await pushStack(stack, subNode, extra)
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
