import { AUTH_SKIP } from 'source/node/module/Auth.js'
import { getRouteParamAny } from 'source/node/server/Responder/Router.js'
import { responderSendJSON } from 'source/node/server/Responder/Send.js'
import { getRequestJSON } from 'source/node/server/function.js'

const PERMISSION_CHECK_ACTION_JSON = 'permission:check:action-json'
const PERMISSION_CHECK_ACTION_JSON_PUBLIC = 'permission:check:action-json-public'

const setup = async ({
  name = 'feature:action-json',
  loggerExot, routePrefix = '',
  featureAuth: { authPack: { authMode }, createResponderCheckAuth },
  featurePermission: { permissionPack: { checkPermission = (type, payload) => true } }, // async (type, { store, ... }) => true/false

  actionMap = {}, // fill in the final action map from `module/ActionJSON/*.js`
  actionMapPublic = {}, // no auth check

  URL_ACTION_JSON = `${routePrefix}/action-json`,
  URL_ACTION_JSON_ABBR = `${routePrefix}/ajson`,
  URL_ACTION_JSON_PUBLIC = `${routePrefix}/action-json-public`,
  URL_ACTION_JSON_PUBLIC_ABBR = `${routePrefix}/AJSON`,

  IS_SKIP_AUTH = authMode === AUTH_SKIP
}) => {
  const routeList = [
    [ [ `${URL_ACTION_JSON}/*`, `${URL_ACTION_JSON_ABBR}/*` ], 'POST', createResponderCheckAuth({
      responderNext: async (store) => {
        const actionType = decodeURIComponent(getRouteParamAny(store) || '')
        const actionFunc = actionMap[ actionType ]
        __DEV__ && !actionFunc && console.log('missing actionFunc for', actionType)
        if (!actionFunc) return // ends with 400
        const actionPayload = await getRequestJSON(store)
        if (!IS_SKIP_AUTH && !(await checkPermission(PERMISSION_CHECK_ACTION_JSON, { store, actionType, actionPayload }))) return // ends with 400
        return responderSendJSON(store, { object: await actionFunc(store, actionPayload) })
      }
    }) ],
    [ [ `${URL_ACTION_JSON_PUBLIC}/*`, `${URL_ACTION_JSON_PUBLIC_ABBR}/*` ], 'POST', async (store) => {
      const actionType = decodeURIComponent(getRouteParamAny(store) || '')
      const actionFunc = actionMapPublic[ actionType ]
      __DEV__ && !actionFunc && console.log('missing actionFunc for', actionType)
      if (!actionFunc) return // ends with 400
      const actionPayload = await getRequestJSON(store)
      if (!(await checkPermission(PERMISSION_CHECK_ACTION_JSON_PUBLIC, { store, actionType, actionPayload }))) return // ends with 400
      return responderSendJSON(store, { object: await actionFunc(store, actionPayload) })
    } ]
  ]

  return {
    actionMap,
    actionMapPublic,

    URL_ACTION_JSON,
    URL_ACTION_JSON_ABBR,
    URL_ACTION_JSON_PUBLIC,
    URL_ACTION_JSON_PUBLIC_ABBR,
    routeList,
    name
  }
}

export {
  PERMISSION_CHECK_ACTION_JSON, PERMISSION_CHECK_ACTION_JSON_PUBLIC,
  setup
}
