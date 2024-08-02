const toCountMap = (map = new Map()) => {
  const cnt = (key) => map.get(key) || 0
  const alt = (key, delta = 1) => {
    const count = cnt(key) + delta
    map.set(key, count)
    return count
  }

  return {
    map,
    cnt,
    alt,
    inc1: (key) => alt(key, 1),
    dec1: (key) => alt(key, -1),
    inc: (key, amount = 1) => alt(key, amount),
    dec: (key, amount = 1) => alt(key, -amount)
  }
}

// like Ruby's Enumerable.tally()
const tally = (list, map) => {
  const cm = toCountMap(map)
  for (const item of list) cm.inc1(item)
  return cm.map
}

export { toCountMap, tally }
