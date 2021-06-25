const initAuthMask = ({
  IS_SKIP_AUTH = false,
  URL_AUTH_CHECK_ABBR,
  URL_AUTH_CHECK = URL_AUTH_CHECK_ABBR,
  onAuthPass,
  authKey = 'auth-check-code' // TODO: NOTE: should match 'DEFAULT_AUTH_KEY' from `module/Auth.js`
}) => {
  const {
    document, fetch, location, URL,
    cE,
    Dr: {
      Common: {
        Function: { lossyAsync },
        Error: { catchAsync },
        Module: { TimedLookup: { generateCheckCode, packDataArrayBuffer, parseDataArrayBuffer } }
      },
      Browser: {
        DOM: { applyReceiveFileListListener, saveArrayBufferCache, loadArrayBufferCache, deleteArrayBufferCache, createDownload },
        Data: { Blob: { parseBlobAsArrayBuffer } }
      }
    }
  } = window

  const authRevoke = () => catchAsync(clearTimedLookupData)

  const authPass = (timedLookupData) => {
    const authUrl = (url) => {
      const urlObject = new URL(url, location.origin)
      !IS_SKIP_AUTH && urlObject.searchParams.set(authKey, generateCheckCode(timedLookupData))
      return String(urlObject)
    }
    return onAuthPass({
      IS_SKIP_AUTH,
      authRevoke, // should reload after
      authUrl,
      authFetch: async (url, option = {}) => {
        const response = await fetch(url, IS_SKIP_AUTH
          ? option
          : { ...option, headers: { [ authKey ]: generateCheckCode(timedLookupData), ...option.headers } }
        )
        if (!response.ok) throw new Error(`[authFetch] status: ${response.status}, url: ${url}`)
        return response
      },
      authDownload: (url, fileName) => createDownload(fileName, authUrl(url))
    })
  }

  if (IS_SKIP_AUTH) return authPass(null) // skipped auth, but keep auth method usable

  const CACHE_BUCKET = '@@cache'
  const CACHE_KEY = 'timedLookupData'
  const saveTimedLookupData = async (timedLookupData) => saveArrayBufferCache(CACHE_BUCKET, CACHE_KEY, packDataArrayBuffer(timedLookupData))
  const loadTimedLookupData = async () => parseDataArrayBuffer(await loadArrayBufferCache(CACHE_BUCKET, CACHE_KEY))
  const clearTimedLookupData = async () => deleteArrayBufferCache(CACHE_BUCKET, CACHE_KEY)

  const PRE_TEXT = 'drop the auth file here, or select file below'
  const authInfoDiv = cE('div', { innerText: PRE_TEXT, style: 'flex: 1;' })
  const authKeyInput = cE('input', { type: 'file' })
  const authSaveInput = cE('input', { type: 'checkbox' })
  const authSaveLabel = cE('label', {}, [ authSaveInput, document.createTextNode('save auth to CacheStorage (HTTPS only)') ]) // check: https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage
  const authMainDiv = cE('div', {
    style: 'display: flex; flex-flow: column; margin: 8px; padding: 8px; width: 480px; height: 480px; max-width: 92vw; max-height: 64vh; line-height: 2em; box-shadow: 0 0 2px 0 #888;'
  }, [ authInfoDiv, authKeyInput, authSaveLabel ])
  const authMaskDiv = cE('div', {
    style: 'position: fixed; display: flex; align-items: center; justify-content: center; top: 0px; left: 0px; width: 100vw; height: 100vh; z-index: 256;'
  }, [ authMainDiv ])

  const authCheck = async (timedLookupData) => {
    const { ok, status } = await fetch(URL_AUTH_CHECK, { method: 'HEAD', headers: { [ authKey ]: generateCheckCode(timedLookupData) } })
    if (!ok) throw new Error(`[authCheck] status: ${status}`)
    return timedLookupData
  }

  const tryAuthCheck = lossyAsync(async () => {
    const fileBlob = authKeyInput.files[ 0 ]
    authInfoDiv.innerText = fileBlob ? fileBlob.name : PRE_TEXT
    if (!fileBlob) return
    const { result: timedLookupData, error } = await catchAsync(async () => authCheck(await parseDataArrayBuffer(await parseBlobAsArrayBuffer(fileBlob))))
    if (error) authInfoDiv.innerText = `auth invalid for file: ${fileBlob.name}`
    else {
      authMaskDiv.remove()
      await authPass(timedLookupData)
      authSaveInput.checked && await catchAsync(saveTimedLookupData, timedLookupData)
    }
  }).trigger

  authKeyInput.addEventListener('change', tryAuthCheck)
  applyReceiveFileListListener(authMaskDiv, (fileList) => {
    authKeyInput.files = fileList
    tryAuthCheck()
  })

  return catchAsync(async () => {
    const { result: timedLookupData, error } = await catchAsync(async () => authCheck(await loadTimedLookupData()))
    if (error) {
      document.body.appendChild(authMaskDiv)
      return authRevoke()
    }
    return authPass(timedLookupData)
  })
}

export { initAuthMask }
