import { BASIC_EXTENSION_MAP } from 'source/common/module/MIME.js'
import { responderSendBufferCompress, prepareBufferData } from 'source/node/server/Responder/Send.js'

import { AUTH_SKIP } from 'source/node/module/Auth.js'
import { ACTION_TYPE as ACTION_TYPE_PATH } from 'source/node/module/ActionJSON/path.js'
import { ACTION_TYPE as ACTION_TYPE_PATH_EXTRA_ARCHIVE } from 'source/node/module/ActionJSON/pathExtraArchive.js'
import { ACTION_TYPE as ACTION_TYPE_STATUS } from 'source/node/module/ActionJSON/status.js'

import { getHTML } from './HTML/main.js'

const setup = async ({
  name = 'feature:explorer',
  loggerExot, routePrefix = '',
  featureAuth: { authPack: { authMode }, URL_AUTH_CHECK_ABBR },
  featureActionJSON: { actionMap, URL_ACTION_JSON_ABBR }, // need `PATH_*` & `STATUS_SERVER_COMMON` action
  featureFile: { IS_READ_ONLY, URL_FILE_SERVE_ABBR, URL_FILE_UPLOAD },

  URL_HTML = `${routePrefix}/explorer`,

  IS_SKIP_AUTH = authMode === AUTH_SKIP
}) => {
  const ACTION_TYPE = { ...ACTION_TYPE_PATH, STATUS_SERVER_COMMON: ACTION_TYPE_STATUS.STATUS_SERVER_COMMON }
  for (const actionType of Object.values(ACTION_TYPE)) if (!actionMap[ actionType ]) throw new Error(`expect ActionJSON provide: ${actionType}`)

  const IS_EXTRA_TAR = Boolean(actionMap[ ACTION_TYPE_PATH_EXTRA_ARCHIVE.PATH_COMPRESS_TAR ])
  const IS_EXTRA_AUTO = Boolean(actionMap[ ACTION_TYPE_PATH_EXTRA_ARCHIVE.PATH_COMPRESS_AUTO ])
  IS_EXTRA_TAR && Object.assign(ACTION_TYPE, { PATH_COMPRESS_TAR: ACTION_TYPE_PATH_EXTRA_ARCHIVE.PATH_COMPRESS_TAR, PATH_EXTRACT_TAR: ACTION_TYPE_PATH_EXTRA_ARCHIVE.PATH_EXTRACT_TAR })
  IS_EXTRA_AUTO && Object.assign(ACTION_TYPE, { PATH_COMPRESS_AUTO: ACTION_TYPE_PATH_EXTRA_ARCHIVE.PATH_COMPRESS_AUTO, PATH_EXTRACT_AUTO: ACTION_TYPE_PATH_EXTRA_ARCHIVE.PATH_EXTRACT_AUTO })

  const HTMLBufferData = prepareBufferData(Buffer.from(getHTML({
    URL_AUTH_CHECK_ABBR, URL_ACTION_JSON_ABBR, URL_FILE_SERVE_ABBR, URL_FILE_UPLOAD,
    IS_SKIP_AUTH, IS_READ_ONLY, IS_EXTRA_TAR, IS_EXTRA_AUTO,
    ACTION_TYPE
  })), BASIC_EXTENSION_MAP.html)

  const routeList = [
    [ URL_HTML, 'GET', (store) => responderSendBufferCompress(store, HTMLBufferData) ]
  ].filter(Boolean)

  return {
    URL_HTML,
    routeList,
    name
  }
}

export { setup }
