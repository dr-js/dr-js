const DEFAULT_TIMEOUT = 30 * 1000 // 30sec

const actionJson = async ({
  actionType, actionPayload,
  urlActionJSON,

  timeout = DEFAULT_TIMEOUT,
  authFetch, // from `module/Auth`
  log
}) => {
  log && log(`[Action|${actionType}]`)

  const result = await (await authFetch(`${urlActionJSON}/${encodeURIComponent(actionType)}`, {
    method: 'POST',
    body: JSON.stringify(actionPayload),
    timeout
  })).json()

  log && log(`[Action|${actionType}] done`)

  return result // should check errorList
}

export { actionJson }
