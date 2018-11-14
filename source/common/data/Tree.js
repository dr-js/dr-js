// NOTE: the search func can be used as walk/traverse, just not return true during search
// NOTE: the initialNode will not appear in search, only below node will

const createTreeDepthFirstSearch = (getSubNodeListFunc) => { // ([ node, level ]) => [ [ node, level + 1, ...extraData ] ] // or return undefined to end branch
  const unshiftStack = (stack, node) => {
    const nodeList = getSubNodeListFunc(node)
    Array.isArray(nodeList) && stack.unshift(...nodeList)
  }
  return (
    initialNode, // [ initialNode, 0 ]
    func // (node) => true/false // return true to end search
  ) => {
    let node
    const stack = []
    unshiftStack(stack, initialNode)
    while ((node = stack.shift())) {
      if (func(node)) return node
      unshiftStack(stack, node)
    }
  }
}

const createTreeDepthFirstSearchAsync = (getSubNodeListFunc) => { // async ([ node, level ]) => [ [ node, level + 1, ...extraData ] ] // or return undefined to end branch
  const unshiftStack = async (stack, node) => {
    const nodeList = await getSubNodeListFunc(node)
    Array.isArray(nodeList) && stack.unshift(...nodeList)
  }
  return async (
    initialNode, // [ initialNode, 0 ]
    func // async (node) => true/false // return true to end search
  ) => {
    let node
    const stack = []
    await unshiftStack(stack, initialNode)
    while ((node = stack.shift())) {
      if (await func(node)) return node
      await unshiftStack(stack, node)
    }
  }
}

const createTreeBreadthFirstSearch = (getSubNodeListFunc) => { // ([ node, level ]) => [ [ node, level + 1, ...extraData ] ] // or return undefined to end branch
  const pushStack = (stack, node) => {
    const nodeList = getSubNodeListFunc(node)
    Array.isArray(nodeList) && stack.push(...nodeList)
  }
  return (
    initialNode, // [ initialNode, 0 ]
    func // (node) => true/false // return true to end search
  ) => {
    let node
    const stack = []
    pushStack(stack, initialNode)
    while ((node = stack.shift())) {
      if (func(node)) return node
      pushStack(stack, node)
    }
  }
}

const createTreeBreadthFirstSearchAsync = (getSubNodeListFunc) => { // async ([ node, level ]) => [ [ node, level + 1, ...extraData ] ] // or return undefined to end branch
  const pushStack = async (stack, node) => {
    const nodeList = await getSubNodeListFunc(node)
    Array.isArray(nodeList) && stack.push(...nodeList)
  }
  return async (
    initialNode, // [ initialNode, 0 ]
    func // async (node) => true/false // return true to end search
  ) => {
    let node
    const stack = []
    await pushStack(stack, initialNode)
    while ((node = stack.shift())) {
      if (await func(node)) return node
      await pushStack(stack, node)
    }
  }
}

const createTreeBottomUpSearch = (getSubNodeListFunc) => { // ([ node, level ]) => [ [ node, level + 1, ...extraData ] ] // or return undefined to end branch
  const pushStack = (stack, node) => {
    const nodeList = getSubNodeListFunc(node)
    return Boolean(Array.isArray(nodeList) && stack.push([ node, nodeList ])) // has subNodeList
  }
  return (
    initialNode, // [ initialNode, 0 ]
    func // (node) => true/false // return true to end search
  ) => {
    const stack = [] // [ node, subNodeList ]
    pushStack(stack, initialNode)
    while (stack.length !== 0) {
      const [ node, subNodeList ] = stack[ stack.length - 1 ]
      if (subNodeList.length === 0) {
        stack.pop()
        if (stack.length !== 0 && func(node)) return node // skip initial node
      } else {
        const subNode = subNodeList.shift()
        const hasSubNodeList = pushStack(stack, subNode)
        if (!hasSubNodeList && func(subNode)) return subNode
      }
    }
  }
}

const createTreeBottomUpSearchAsync = (getSubNodeListFunc) => { // async ([ node, level ]) => [ [ node, level + 1, ...extraData ] ] // or return undefined to end branch
  const pushStack = async (stack, node) => {
    const nodeList = await getSubNodeListFunc(node)
    return Boolean(Array.isArray(nodeList) && stack.push([ node, nodeList ])) // has subNodeList
  }
  return async (
    initialNode, // [ initialNode, 0 ]
    func // async (node) => true/false // return true to end search
  ) => {
    const stack = [] // [ node, subNodeList ]
    await pushStack(stack, initialNode)
    while (stack.length !== 0) {
      const [ node, subNodeList ] = stack[ stack.length - 1 ]
      if (subNodeList.length === 0) {
        stack.pop()
        if (stack.length !== 0 && await func(node)) return node // skip initial node
      } else {
        const subNode = subNodeList.shift()
        const hasSubNodeList = await pushStack(stack, subNode)
        if (!hasSubNodeList && await func(subNode)) return subNode
      }
    }
  }
}

export {
  createTreeDepthFirstSearch,
  createTreeDepthFirstSearchAsync,

  createTreeBreadthFirstSearch,
  createTreeBreadthFirstSearchAsync,

  createTreeBottomUpSearch,
  createTreeBottomUpSearchAsync
}
