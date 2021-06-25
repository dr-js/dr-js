import { createPathPrefixLock } from 'source/node/file/Path.js'
import { responderEndWithStatusCode } from 'source/node/server/Responder/Common.js'
import { createResponderServeStatic } from 'source/node/server/Responder/ServeStatic.js'

import { createOnFileChunkUpload } from 'source/node/module/FileChunkUpload.js'
import { getRequestBuffer } from 'source/node/server/function.js'

const createResponderServeFile = ({
  rootPath,
  responderFallback, // (store, { error, relativePath }) => {}
  extraOption
}) => {
  const getPath = createPathPrefixLock(rootPath)
  const responderServeStatic = createResponderServeStatic({ expireTime: 10 * 1000, ...extraOption }) // 10sec expire
  return responderFallback
    ? (store, relativePath) => responderServeStatic(store, getPath(relativePath)).catch((error) => responderFallback(store, { error, relativePath }))
    : (store, relativePath) => responderServeStatic(store, getPath(relativePath))
}

const createResponderFileChunkUpload = async ({
  rootPath,
  mergePath,
  loggerExot
}) => {
  const fileChunkUpload = await createOnFileChunkUpload({
    rootPath,
    mergePath,
    onError: (error) => {
      loggerExot.add(`[ERROR][FileChunkUpload] ${error}`)
      console.error(error)
    }
  })
  return async (store, extraFileUploadOption = {}) => {
    await fileChunkUpload({
      bufferPacket: await getRequestBuffer(store),
      ...extraFileUploadOption
    })
    return responderEndWithStatusCode(store, { statusCode: 200 })
  }
}

export {
  createResponderServeFile,
  createResponderFileChunkUpload
}
