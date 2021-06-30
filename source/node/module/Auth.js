import { promises as fsAsync } from 'fs'
import {
  verifyCheckCode, verifyParsedCheckCode,
  generateCheckCode, generateLookupData,
  parseCheckCode,
  packDataArrayBuffer, parseDataArrayBuffer
} from 'source/common/module/TimedLookup.js'
import { createCacheMap } from 'source/common/data/CacheMap.js'
import { time, binary, prettyStringifyJSON } from 'source/common/format.js'
import { indentList } from 'source/common/string.js'
import { getEntityTagByContentHash } from 'source/node/module/EntityTag.js'

import { fetchLikeRequest } from 'source/node/net.js'
import { toArrayBuffer } from 'source/node/data/Buffer.js'
import { createPathPrefixLock } from 'source/node/fs/Path.js'

const saveAuthFile = (pathFile, timedLookupData) => fsAsync.writeFile(pathFile, Buffer.from(packDataArrayBuffer(timedLookupData)))
const loadAuthFile = async (pathFile) => parseDataArrayBuffer(toArrayBuffer(await fsAsync.readFile(pathFile)))
const describeAuthFile = async (pathFile) => {
  const { tag, size, tokenSize, timeGap, info, dataView } = await loadAuthFile(pathFile)
  return indentList('[AuthFile]', [
    `tag: ${tag}`,
    `size: ${binary(size)}B`,
    `tokenSize: ${tokenSize}B`,
    `timeGap: ${time(timeGap * 1000)}`,
    info && `info: ${prettyStringifyJSON(info)}`,
    `dataViewEntityTag: ${getEntityTagByContentHash(Buffer.from(dataView.buffer))}`
  ].filter(Boolean))
}
const generateAuthFile = async (pathFile, { tag, size, tokenSize, timeGap, info }) => {
  const timedLookupData = await generateLookupData({ tag, size, tokenSize, timeGap, info })
  await saveAuthFile(pathFile, timedLookupData)
  return timedLookupData
}
const generateAuthCheckCode = async (pathFile, timestamp) => generateCheckCode(await loadAuthFile(pathFile), timestamp)
const verifyAuthCheckCode = async (pathFile, checkCode, timestamp) => verifyCheckCode(await loadAuthFile(pathFile), checkCode, timestamp)

const DEFAULT_AUTH_KEY = 'auth-check-code' // TODO: NOTE: should match 'DEFAULT_AUTH_KEY' from `./html.js`

const AUTH_SKIP = 'auth-skip'
const AUTH_FILE = 'auth-file'
const AUTH_FILE_GROUP = 'auth-file-group'

const authFetchWrap = async (url, option = {}, timedLookupData, authKey) => {
  const response = await fetchLikeRequest(url, {
    ...option,
    headers: { [ authKey ]: generateCheckCode(timedLookupData), ...option.headers }
  })
  if (!response.ok) throw new Error(`[authFetch] status: ${response.status}`)
  return response
}

const configureAuthSkip = async ({
  authKey = DEFAULT_AUTH_KEY, log
}) => {
  log && log('auth skip enabled')

  return {
    authMode: AUTH_SKIP,
    authKey,
    authFetch: fetchLikeRequest,
    checkAuth: async () => 'auth-skip', // as a token / identity info if next responder need to use
    generateAuthCheckCode: async () => 'auth-skip'
  }
}

const configureAuthFile = async ({
  authKey = DEFAULT_AUTH_KEY, log,

  timedLookupData, // directly pass
  authFile // file to load from
}) => {
  if (!timedLookupData) {
    timedLookupData = await loadAuthFile(authFile).catch(async (error) => {
      log && log('missing auth file', error)
      throw error
    })
    log && log('loaded auth file')
  }

  return {
    authMode: AUTH_FILE,
    authKey,
    authFetch: async (url, option) => authFetchWrap(url, option, timedLookupData, authKey),
    checkAuth: async (checkCode) => {
      verifyCheckCode(timedLookupData, checkCode)
      return timedLookupData.tag // as a token / identity info if next responder need to use
    },
    generateAuthCheckCode: async () => generateCheckCode(timedLookupData)
  }
}

const AUTH_CACHE_EXPIRE_TIME = 5 * 60 * 1000 // 5min, in msec
const AUTH_CACHE_SIZE_SUM_MAX = 8 * 1024 * 1024 // 8MiB, in byte

const configureAuthFileGroup = async ({
  authKey = DEFAULT_AUTH_KEY, log,

  authFileGroupPath, // file name should match `getFileNameForTag` and `authFileGroupKeySuffix`
  authFileGroupDefaultTag,
  authFileGroupKeySuffix,

  getFileNameForTag = authFileGroupKeySuffix ? (tag) => `${tag}${authFileGroupKeySuffix}` : (tag) => `${tag}.key`,

  authCacheExpireTime = AUTH_CACHE_EXPIRE_TIME,
  authCacheMap = createCacheMap({ valueSizeSumMax: AUTH_CACHE_SIZE_SUM_MAX, eventHub: null })
}) => {
  const getPath = createPathPrefixLock(authFileGroupPath)
  const getTimedLookupData = (tag) => authCacheMap.get(tag) || loadAuthFile(getPath(getFileNameForTag(tag))).then(
    (timedLookupData) => {
      authCacheMap.set(tag, timedLookupData, timedLookupData.dataView.byteLength, Date.now() + authCacheExpireTime)
      log && log(`loaded auth file for tag: ${tag}`)
      return timedLookupData
    },
    (error) => {
      __DEV__ && console.log('getTimedLookupData failed', error)
      log && log(`no auth file for tag: ${tag}`)
      throw error
    }
  )

  return {
    authMode: AUTH_FILE_GROUP,
    authKey,
    authFetch: async (url, option, tag = authFileGroupDefaultTag) => authFetchWrap(url, option, await getTimedLookupData(tag), authKey),
    checkAuth: async (checkCode) => {
      const parsedCheckCode = parseCheckCode(checkCode)
      const tag = parsedCheckCode[ 0 ]
      const timedLookupData = await getTimedLookupData(tag)
      verifyParsedCheckCode(timedLookupData, parsedCheckCode)
      return timedLookupData.tag
    },
    generateAuthCheckCode: async (tag = authFileGroupDefaultTag) => generateCheckCode(await getTimedLookupData(tag))
  }
}

const configureAuth = async ({
  authKey = DEFAULT_AUTH_KEY, log,
  authSkip = false,
  authFile,
  authFileGroupPath, authFileGroupDefaultTag, authFileGroupKeySuffix
}) => {
  if (authSkip) return configureAuthSkip({ authKey, log })
  if (authFile) return configureAuthFile({ authFile, authKey, log })
  if (authFileGroupPath) return configureAuthFileGroup({ authFileGroupPath, authFileGroupDefaultTag, authFileGroupKeySuffix, authKey, log })
  throw new Error('no auth mode option provided')
}

export {
  saveAuthFile, loadAuthFile,
  describeAuthFile, generateAuthFile,
  generateAuthCheckCode, verifyAuthCheckCode,

  DEFAULT_AUTH_KEY,

  AUTH_SKIP,
  AUTH_FILE,
  AUTH_FILE_GROUP,

  configureAuthSkip,
  configureAuthFile,
  configureAuthFileGroup,

  configureAuth
}
