import { createHash } from 'crypto'
import { readableStreamToBufferAsync } from 'source/node/data/Stream'

const getEntityTagByContentHash = (buffer) => {
  const length = buffer.length.toString(16)
  const hashString = createHash('sha1').update(buffer).digest('base64')
  return `"${length}-${hashString}"`
}

const getEntityTagByContentHashAsync = async (buffer) => {
  const length = buffer.length.toString(16)
  const hash = createHash('sha1')
  hash.write(buffer)
  hash.end()
  const hashBuffer = await readableStreamToBufferAsync(hash)
  return `"${length}-${hashBuffer.toString('base64')}"`
}

const getWeakEntityTagByStat = (stat) => {
  const size = stat.size.toString(16)
  const modifyTime = stat.mtimeMs.toString(16)
  return `W/"${size}-${modifyTime}"`
}

export {
  getEntityTagByContentHash,
  getEntityTagByContentHashAsync,
  getWeakEntityTagByStat
}
