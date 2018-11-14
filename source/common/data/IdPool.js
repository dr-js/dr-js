const createIdPool = (initialIdList = []) => { // TODO: DEPRECATE: not using? or sort method name
  const pool = new Set(initialIdList)
  return {
    requestID: (id = 0) => { // might not be the id you expect, but will be near
      while (pool.has(id)) id++
      pool.add(id)
      return id
    },
    deleteID: (id) => pool.delete(id),
    hasID: (id) => pool.has(id),
    clear: () => pool.clear()
  }
}

export { createIdPool }
