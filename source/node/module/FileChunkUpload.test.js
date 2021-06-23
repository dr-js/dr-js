import { resolve } from 'path'
import { promises as fsAsync } from 'fs'
import { strictEqual } from 'source/common/verify'
import { readableStreamToBufferAsync } from 'source/node/data/Stream'
import { resetDirectory } from 'source/node/file/Directory'
import { modifyDelete } from 'source/node/file/Modify'
import { getUnusedPort } from 'source/node/server/function'
import { createServerExot, createRequestListener } from 'source/node/server/Server'
import { responderEndWithStatusCode } from 'source/node/server/Responder/Common'
import { createRouteMap, createResponderRouter } from 'source/node/server/Responder/Router'
import { fetchLikeRequest } from 'source/node/net'

import {
  createOnFileChunkUpload,
  uploadFileByChunk
} from './FileChunkUpload'

const { describe, it, before, after, info = console.log } = global

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
  const sourceBuffer = await fsAsync.readFile(TEST_SOURCE)
  let loopCount = 2 ** 9 // will produce about 3MiB file
  while ((loopCount -= 1) !== 0) await fsAsync.appendFile(TEST_FILE, sourceBuffer)
})
after(async () => {
  await modifyDelete(TEST_ROOT)
})

describe('Node.Module.FileChunkUpload', () => {
  it('uploadFileByChunk() fileBuffer', withTestServer(async ({ baseUrl, testFileChunkUploadOption, testFileChunkUploadUrl }) => {
    const fileBuffer = await fsAsync.readFile(TEST_FILE)
    const key = 'test-file-buffer'
    await uploadFileByChunk({
      fileBuffer,
      key,
      chunkSizeMax: 8 * 1024,
      onProgress: (uploadedSize, totalSize) => __DEV__ && info(` ${uploadedSize}/${totalSize}`),
      uploadFileChunk: async (chainArrayBufferPacket, { key, chunkByteLength, chunkIndex, chunkTotal }) => fetchLikeRequest(testFileChunkUploadUrl, { method: 'POST', body: chainArrayBufferPacket })
        .catch((error) => {
          const message = `[ERROR][Upload] upload chunk ${chunkIndex}/${chunkTotal} of ${key}, size: ${chunkByteLength}`
          info(message, error)
          throw new Error(message)
        })
    })

    strictEqual(fileBuffer.compare(await fsAsync.readFile(resolve(testFileChunkUploadOption.rootPath, key))), 0)
  }))

  it('uploadFileByChunk() filePath', withTestServer(async ({ baseUrl, testFileChunkUploadOption, testFileChunkUploadUrl }) => {
    const key = 'test-file-path'
    await uploadFileByChunk({
      filePath: TEST_FILE,
      key,
      chunkSizeMax: 8 * 1024,
      onProgress: (uploadedSize, totalSize) => __DEV__ && info(` ${uploadedSize}/${totalSize}`),
      uploadFileChunk: async (chainArrayBufferPacket, { key, chunkByteLength, chunkIndex, chunkTotal }) => fetchLikeRequest(testFileChunkUploadUrl, { method: 'POST', body: chainArrayBufferPacket })
        .catch((error) => {
          const message = `[ERROR][Upload] upload chunk ${chunkIndex}/${chunkTotal} of ${key}, size: ${chunkByteLength}`
          info(message, error)
          throw new Error(message)
        })
    })
    const fileBuffer = await fsAsync.readFile(TEST_FILE)
    strictEqual(fileBuffer.compare(await fsAsync.readFile(resolve(testFileChunkUploadOption.rootPath, key))), 0)
  }))
})
