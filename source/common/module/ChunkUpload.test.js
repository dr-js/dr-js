import { strictEqual, truthy } from 'source/common/verify.js'
import { getRandomArrayBuffer, getRandomId62S } from 'source/common/math/random.js'
import { getSample } from 'source/common/math/sample.js'
import { isEqualArrayBuffer, concatArrayBuffer } from 'source/common/data/ArrayBuffer.js'
import {
  packArrayBufferChunk, parseArrayBufferChunk,
  uploadArrayBufferByChunk
} from './ChunkUpload.js'

const { describe, it, info = console.log } = globalThis

describe('Common.Module.ChunkUpload', () => {
  it('packArrayBufferChunk(),parseArrayBufferChunk()', async () => {
    const testChunkInfo = {
      chunkArrayBuffer: getRandomArrayBuffer(64),
      key: getRandomId62S(), chunkIndex: 0, chunkTotal: 1
    }
    const testPacket = await packArrayBufferChunk(testChunkInfo, true)
    const resultChunkInfo = await parseArrayBufferChunk(testPacket, true)

    truthy(isEqualArrayBuffer(testChunkInfo.chunkArrayBuffer, resultChunkInfo.chunkArrayBuffer))
    strictEqual(testChunkInfo.key, resultChunkInfo.key)
    strictEqual(testChunkInfo.chunkIndex, resultChunkInfo.chunkIndex)
    strictEqual(testChunkInfo.chunkTotal, resultChunkInfo.chunkTotal)
  })

  it('uploadArrayBufferByChunk()', async () => {
    const fragArrayBuffer = getRandomArrayBuffer(1234)
    const testArrayBuffer = concatArrayBuffer(getSample(() => fragArrayBuffer, 1234 * 5)) // bigger than 5MiB
    const resultChunkInfoList = []

    await uploadArrayBufferByChunk({
      arrayBuffer: testArrayBuffer, key: getRandomId62S(), isSkipVerifyHash: true,
      uploadChunk: async (arrayBufferPacket, { chunkArrayBuffer, key, chunkIndex, chunkTotal }) => {
        resultChunkInfoList.push(await parseArrayBufferChunk(arrayBufferPacket, true))
      },
      onProgress: (uploadedSize, totalSize) => info('upload', uploadedSize, totalSize)
    })

    const resultArrayBuffer = concatArrayBuffer(resultChunkInfoList.map(({ chunkArrayBuffer }) => chunkArrayBuffer))

    strictEqual(resultArrayBuffer.byteLength, 1234 * 1234 * 5)
    truthy(isEqualArrayBuffer(testArrayBuffer, resultArrayBuffer))
  })
})
