import { binary } from 'source/common/format.js'

import { parseBufferPacket, packBufferPacket } from 'source/node/data/BufferPacket.js'
import { responderSendBufferCompress } from 'source/node/server/Responder/Send.js'
import { fetchLikeRequest } from 'source/node/net.js'

import { getRequestBuffer } from 'source/node/server/function.js'

const responderServerFetch = async (store) => {
  const [ headerString, requestBodyBuffer ] = parseBufferPacket(await getRequestBuffer(store))
  const { url, option = {} } = JSON.parse(headerString)
  __DEV__ && console.log(`   - [ResponderServerFetch] url: ${url}, method: ${option.method}, request-body: ${binary(requestBodyBuffer.length)}B`)

  const { status, headers, buffer } = await fetchLikeRequest(url, {
    ...option,
    body: requestBodyBuffer
  })
  const responseBodyBuffer = await buffer()
  __DEV__ && console.log(`   - [ResponderServerFetch] url: ${url}, status: ${status}, response-body: ${binary(responseBodyBuffer.length)}B`)

  return responderSendBufferCompress(store, {
    buffer: packBufferPacket(
      JSON.stringify({ status, headers }),
      responseBodyBuffer
    )
  })
}

export { responderServerFetch }
