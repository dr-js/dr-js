import { calcHash } from 'source/node/data/Buffer'

const getEntityTagByContentHash = (buffer) => {
  const length = buffer.length.toString(16)
  const hashString = calcHash(buffer)
  return `"${length}-${hashString}"`
}

const getWeakEntityTagByStat = (stat) => {
  const size = stat.size.toString(16)
  const modifyTime = stat.mtimeMs.toString(16)
  return `W/"${size}-${modifyTime}"`
}

export {
  getEntityTagByContentHash,
  getWeakEntityTagByStat
}
