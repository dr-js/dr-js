import { createHash } from 'crypto'

const getEntityTagByContentHash = (buffer) => {
  const length = buffer.length.toString(16)
  const hash = createHash('sha1').update(buffer).digest('base64') // TODO: this is sync code
  return `"${length}-${hash}"`
}

const getWeakEntityTagByStat = (stat) => {
  const size = stat.size.toString(16)
  const modifyTime = stat.mtime.getTime().toString(16)
  return `W/"${size}-${modifyTime}"`
}

export {
  getEntityTagByContentHash,
  getWeakEntityTagByStat
}
