import { dirname } from 'path'
import { createWriteStream, promises as fsAsync } from 'fs'

import { withRetryAsync } from 'source/common/function.js'
import { percent, binary } from 'source/common/format.js'
import { lazyEncodeURI } from 'source/common/string.js'
import { quickRunletFromStream } from 'source/node/data/Stream.js'
import { createDirectory } from 'source/node/fs/Directory.js'

import { uploadFileByChunk } from 'source/node/module/FileChunkUpload.js'

const DEFAULT_TIMEOUT = 30 * 1000

const fileUpload = async ({
  fileInputPath: filePath, // suggested, will save memory for large files
  fileBuffer, // optional, good for small files, if both passed, will use buffer
  key,
  urlFileUpload,

  timeout = DEFAULT_TIMEOUT, maxRetry = 4, wait = 1000,
  authFetch, // from `module/Auth`
  log,

  onProgress = (uploadedSize, totalSize) => log && log(`[Upload] upload: ${percent(uploadedSize / totalSize)}`)
}) => {
  const fileSize = fileBuffer ? fileBuffer.length : (await fsAsync.stat(filePath)).size
  log && log(`[Upload] key: ${key}, size: ${binary(fileSize)}B`)

  await uploadFileByChunk({
    fileBuffer, filePath, fileSize,
    key,
    onProgress,
    uploadChunk: async (arrayBufferPacket, { key, chunkIndex, chunkTotal }) => withRetryAsync(
      async () => authFetch(urlFileUpload, { method: 'POST', body: arrayBufferPacket, timeout }).catch((error) => {
        const message = `[ERROR][Upload] upload chunk ${chunkIndex}/${chunkTotal} of ${key}, packet size: ${arrayBufferPacket.byteLength}`
        log && log(message, error)
        throw new Error(message)
      }),
      maxRetry,
      wait
    )
  })

  log && log(`[Upload] done: ${key}`)
}

const fileDownload = async ({
  fileOutputPath, // optional, if set will stream file to disk, else will return file as buffer
  key,
  urlFileDownload,

  timeout = DEFAULT_TIMEOUT,
  authFetch, // from `module/Auth`
  log
}) => {
  log && log(`[Download] key: ${key}`)

  fileOutputPath && await createDirectory(dirname(fileOutputPath))

  const response = await authFetch(`${urlFileDownload}/${lazyEncodeURI(key)}`, { method: 'GET', timeout })
  if (fileOutputPath) {
    await quickRunletFromStream(response.stream(), createWriteStream(fileOutputPath))
    log && log(`[Download] done: ${fileOutputPath}`)
  } else {
    const fileBuffer = await response.buffer()
    log && log(`[Download] get: ${binary(fileBuffer.length)}B`)
    return fileBuffer
  }
}

export {
  fileUpload,
  fileDownload
}
