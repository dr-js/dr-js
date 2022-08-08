import { getRouteParamAny } from 'source/node/server/Responder/Router.js'

import { AUTH_SKIP } from 'source/node/module/Auth.js'

import {
  createResponderServeFile,
  createResponderFileChunkUpload
} from './responder.js'

const PERMISSION_CHECK_FILE_UPLOAD_START = 'permission:check:file-upload-start'

const setup = async ({
  name = 'feature:file',
  loggerExot, routePrefix = '',
  featureAuth: { authPack: { authMode }, createResponderCheckAuth },
  featurePermission: { permissionPack: { checkPermission = (type, payload) => true } }, // async (type, { store, ... }) => true/false

  fileRootPath,
  fileRootPathPublic, // can skip to deny public file access, and if set should be under fileRootPath, so upload can also reach the public path
  fileUploadMergePath,

  serveConfig: { // mostly for direct script use
    responderFallback, responderFallbackPublic, // useful to redirect to root path, or just better log error
    extraOption, extraOptionPublic // enable gzip
  } = {},

  enhanceFileChunkUploadOption = (option) => option,

  URL_FILE_SERVE = `${routePrefix}/file-serve`,
  URL_FILE_SERVE_ABBR = `${routePrefix}/f`,
  URL_FILE_SERVE_PUBLIC = `${routePrefix}/file-serve-public`,
  URL_FILE_SERVE_PUBLIC_ABBR = `${routePrefix}/F`,
  URL_FILE_UPLOAD = `${routePrefix}/file-chunk-upload`,

  IS_SKIP_AUTH = authMode === AUTH_SKIP,
  IS_READ_ONLY = !fileUploadMergePath // TODO: should be decided by user permission
}) => {
  const responderFileServe = createResponderServeFile({ rootPath: fileRootPath, responderFallback, extraOption })
  const responderFileServePublic = fileRootPathPublic && createResponderServeFile({ rootPath: fileRootPathPublic, responderFallback: responderFallbackPublic, extraOption: extraOptionPublic })

  const responderFileChunkUpload = IS_READ_ONLY
    ? (store, extraFileUploadOption) => {}
    : await createResponderFileChunkUpload({ rootPath: fileRootPath, mergePath: fileUploadMergePath, loggerExot })

  const routeList = [
    [ [ `${URL_FILE_SERVE}/*`, `${URL_FILE_SERVE_ABBR}/*` ], [ 'GET', 'HEAD' ], createResponderCheckAuth({
      responderNext: (store) => responderFileServe(store, decodeURIComponent(getRouteParamAny(store) || ''))
    }) ],
    responderFileServePublic && [ [ `${URL_FILE_SERVE_PUBLIC}/*`, `${URL_FILE_SERVE_PUBLIC_ABBR}/*` ], [ 'GET', 'HEAD' ], (store) => responderFileServePublic(store, decodeURIComponent(getRouteParamAny(store) || '')) ],
    [ URL_FILE_UPLOAD, 'POST', createResponderCheckAuth({
      responderNext: (store) => responderFileChunkUpload(store, enhanceFileChunkUploadOption({
        onUploadStart: async ({ filePath, key }) => {
          if (IS_SKIP_AUTH || await checkPermission(PERMISSION_CHECK_FILE_UPLOAD_START, { store, filePath, key, IS_READ_ONLY })) return // pass
          throw new Error(`deny file upload: ${key}`) // ends with 500
        }
      }))
    }) ]
  ].filter(Boolean)

  return {
    fileRootPath,
    fileRootPathPublic,
    fileUploadMergePath,

    IS_READ_ONLY,

    URL_FILE_SERVE,
    URL_FILE_SERVE_PUBLIC,
    URL_FILE_SERVE_ABBR,
    URL_FILE_SERVE_PUBLIC_ABBR,
    URL_FILE_UPLOAD,
    routeList,
    name
  }
}

export {
  PERMISSION_CHECK_FILE_UPLOAD_START,
  setup
}
