const initServerFetch = ({
  URL_SERVER_FETCH,
  fetch = window.fetch // or use authFetch, fetchLikeRequest
}) => {
  const {
    Blob,
    Dr: {
      Browser: {
        Data: {
          Blob: { parseBlobAsArrayBuffer, parseBlobAsText },
          BlobPacket: { packBlobPacket, parseBlobPacket }
        }
      }
    }
  } = window

  const toBodyBlob = (body) => (body === undefined || body instanceof Blob)
    ? body
    : new Blob([ body ])

  const fetchBlobCORS = async (url, { body, ...option } = {}) => {
    const response = await fetch(URL_SERVER_FETCH, {
      method: 'POST',
      body: packBlobPacket(
        JSON.stringify({ url, option }),
        toBodyBlob(body)
      )
    })
    const [ headerString, payloadBlob ] = await parseBlobPacket(await response.blob())
    const { status, headers } = JSON.parse(headerString)
    const text = () => parseBlobAsText(payloadBlob)
    return { // like fetch
      status,
      ok: (status >= 200 && status < 300),
      headers,
      arrayBuffer: () => parseBlobAsArrayBuffer(payloadBlob),
      blob: () => payloadBlob,
      text,
      json: async () => JSON.parse(await text())
    }
  }

  return { fetchBlobCORS }
}

export { initServerFetch }
