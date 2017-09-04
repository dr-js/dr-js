const createIdPool = (idData = []) => {
  const pool = new Set(idData)
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
