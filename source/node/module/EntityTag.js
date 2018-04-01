import { createHash } from 'crypto'
import { receiveBufferAsync } from 'source/node/data/Buffer'

const getEntityTagByContentHash = (buffer) => {
  const length = buffer.length.toString(16)
  const hashString = createHash('sha1').update(buffer).digest('base64') // TODO: this is sync code
  return `"${length}-${hashString}"`
}

const getEntityTagByContentHashAsync = async (buffer) => {
  const length = buffer.length.toString(16)
  const hash = createHash('sha1')
  hash.write(buffer)
  hash.end()
  const hashBuffer = await receiveBufferAsync(hash)
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
