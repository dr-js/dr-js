import { calcHash } from 'source/node/data/Buffer.js'

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

const getEntityTagByContentHashAsync = async (buffer) => getEntityTagByContentHash(buffer) // TODO: DEPRECATE: just use the sync version, this will not be more efficient as the buffer should already be in memory

export {
  getEntityTagByContentHash,
  getWeakEntityTagByStat,

  getEntityTagByContentHashAsync // TODO: DEPRECATE
}
