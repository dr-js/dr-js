import { createHash } from 'crypto'

const getEntityTagByContentHash = (buffer) => {
  const length = buffer.length.toString(16)
  const hash = createHash('sha1') // TODO: this is sync code
    .update(buffer, 'utf8')
    .digest('base64')
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
