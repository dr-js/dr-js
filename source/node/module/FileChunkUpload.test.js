import { resolve } from 'path'
import { strictEqual } from 'source/common/verify.js'
import { readableStreamToBufferAsync } from 'source/node/data/Stream.js'
import { appendBuffer, readBuffer } from 'source/node/fs/File.js'
import { deleteDirectory, resetDirectory } from 'source/node/fs/Directory.js'
import { getUnusedPort } from 'source/node/server/function.js'
import { createServerExot, createRequestListener } from 'source/node/server/Server.js'
import { responderEndWithStatusCode } from 'source/node/server/Responder/Common.js'
import { createRouteMap, createResponderRouter } from 'source/node/server/Responder/Router.js'
import { fetchLikeRequest } from 'source/node/net.js'

import {
  createOnFileChunkUpload,
  uploadFileByChunk
} from './FileChunkUpload.js'

const { describe, it, before, after, info = console.log } = globalThis

const TEST_ROOT = resolve(__dirname, './test-file-chunk-upload-gitignore/')
const TEST_SOURCE = resolve(__dirname, './FileChunkUpload.js')
const TEST_FILE = resolve(TEST_ROOT, './file')

const withTestServer = (asyncTest) => async () => {
  const testFileChunkUploadOption = {
    rootPath: resolve(TEST_ROOT, 'root/'),
    mergePath: resolve(TEST_ROOT, 'merge/')
  }
  const onFileChunkUpload = await createOnFileChunkUpload(testFileChunkUploadOption)

  const URL_FILE_CHUNK_UPLOAD = '/test-file-chunk-upload'

  const { up, down, server, option: { baseUrl } } = createServerExot({ protocol: 'http:', hostname: '127.0.0.1', port: await getUnusedPort() })
  server.on('request', createRequestListener({
    responderList: [
      createResponderRouter({
        routeMap: createRouteMap([
          [ '/test-file-chunk-upload', 'POST', async (store) => {
            await onFileChunkUpload({ bufferPacket: await readableStreamToBufferAsync(store.request) })
            return responderEndWithStatusCode(store, { statusCode: 200 })
          } ]
        ]),
        baseUrl
      })
    ]
  }))
  await up()
  await asyncTest({ baseUrl, testFileChunkUploadOption, testFileChunkUploadUrl: `${baseUrl}${URL_FILE_CHUNK_UPLOAD}` })
  await down()
}

before(async () => {
  await resetDirectory(TEST_ROOT)
  const sourceBuffer = await readBuffer(TEST_SOURCE)
  let loopCount = 2 ** 9 // will produce about 3MiB file
  while ((loopCount -= 1) !== 0) await appendBuffer(TEST_FILE, sourceBuffer)
})
after(async () => {
  await deleteDirectory(TEST_ROOT)
})

describe('Node.Module.FileChunkUpload', () => {
  it('uploadFileByChunk() fileBuffer', withTestServer(async ({ baseUrl, testFileChunkUploadOption, testFileChunkUploadUrl }) => {
    const fileBuffer = await readBuffer(TEST_FILE)
    const key = 'test-file-buffer'
    await uploadFileByChunk({
      fileBuffer,
      key,
      chunkSizeMax: 8 * 1024,
      onProgress: (uploadedSize, totalSize) => __DEV__ && info(` ${uploadedSize}/${totalSize}`),
      uploadChunk: async (arrayBufferPacket, { key, chunkIndex, chunkTotal }) => fetchLikeRequest(testFileChunkUploadUrl, { method: 'POST', body: arrayBufferPacket })
        .catch((error) => {
          const message = `[ERROR][Upload] upload chunk ${chunkIndex}/${chunkTotal} of ${key}, packet size: ${arrayBufferPacket.byteLength}`
          info(message, error)
          throw new Error(message)
        })
    })

    strictEqual(fileBuffer.compare(await readBuffer(resolve(testFileChunkUploadOption.rootPath, key))), 0)
  }))

  it('uploadFileByChunk() filePath', withTestServer(async ({ baseUrl, testFileChunkUploadOption, testFileChunkUploadUrl }) => {
    const key = 'test-file-path'
    await uploadFileByChunk({
      filePath: TEST_FILE,
      key,
      chunkSizeMax: 8 * 1024,
      onProgress: (uploadedSize, totalSize) => __DEV__ && info(` ${uploadedSize}/${totalSize}`),
      uploadChunk: async (arrayBufferPacket, { key, chunkIndex, chunkTotal }) => fetchLikeRequest(testFileChunkUploadUrl, { method: 'POST', body: arrayBufferPacket })
        .catch((error) => {
          const message = `[ERROR][Upload] upload chunk ${chunkIndex}/${chunkTotal} of ${key}, packet size: ${arrayBufferPacket.byteLength}`
          info(message, error)
          throw new Error(message)
        })
    })
    const fileBuffer = await readBuffer(TEST_FILE)
    strictEqual(fileBuffer.compare(await readBuffer(resolve(testFileChunkUploadOption.rootPath, key))), 0)
  }))
})
