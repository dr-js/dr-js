const pathContentStyle = `<style>
h2, h6 { margin: 0.5em 4px; }
.select, .directory, .file { display: flex; flex-flow: row nowrap; align-items: stretch; }
.directory:hover, .file:hover { background: var(--c-fill-s); }
.name { overflow:hidden; flex: 1; white-space:nowrap; text-align: left; text-overflow: ellipsis; background: transparent; }
.select .name, .file .name { pointer-events: none; color: #888; }
.edit { pointer-events: auto; min-width: 1.5em; min-height: auto; line-height: normal; }
</style>`

// TODO: add drag selection

const initPathContent = (
  URL_ACTION_JSON_ABBR, URL_FILE_SERVE_ABBR,
  IS_READ_ONLY = true, IS_EXTRA_TAR = false, IS_EXTRA_AUTO = false,
  ACTION_TYPE,
  authFetch, withConfirmModal, withPromptModal
) => {
  const {
    open,
    qS, cE, aCL,
    Dr: { Common: { Format, String: { lazyEncodeURI }, Compare: { compareStringWithNumber } } }
  } = window

  const SORT_FUNC = { // ([ nameA, sizeA, mtimeMsA ], [ nameB, sizeB, mtimeMsB ]) => 0,
    NAME: ([ nameA ], [ nameB ]) => compareStringWithNumber(nameA, nameB),
    TIME: ([ , , mtimeMsA = 0 ], [ , , mtimeMsB = 0 ]) => mtimeMsB - mtimeMsA, // newer first
    SIZE: ([ , sizeA ], [ , sizeB ]) => sizeB - sizeA // bigger first
  }
  const SORT_TYPE_LIST = Object.keys(SORT_FUNC)

  const PATH_ROOT = '.'
  const pathPush = (relativePath, name) => relativePath === PATH_ROOT ? name : `${relativePath}/${name}`
  const pathPop = (relativePath) => relativePath === PATH_ROOT ? PATH_ROOT : relativePath.split('/').slice(0, -1).join('/')
  const pathName = (relativePath) => relativePath === PATH_ROOT ? '[ROOT]' : `${relativePath}/`

  const initialPathContentState = {
    pathSortType: SORT_TYPE_LIST[ 0 ],
    pathContent: {
      relativePath: PATH_ROOT,
      directoryList: [ /* name */ ],
      fileList: [ /* [ name, size, mtimeMs ] */ ]
    }
  }

  const authFetchActionJSON = async (actionType, actionPayload = {}) => (await authFetch(`${URL_ACTION_JSON_ABBR}/${encodeURIComponent(actionType)}`, { method: 'POST', body: JSON.stringify(actionPayload) })).json()

  const cyclePathSortType = (pathContentStore, pathSortType = pathContentStore.getState().pathSortType) => {
    const nextSortIndex = (SORT_TYPE_LIST.indexOf(pathSortType) + 1) % SORT_TYPE_LIST.length
    pathContentStore.setState({ pathSortType: SORT_TYPE_LIST[ nextSortIndex ] })
  }

  const doLoadPath = async (pathContentStore, relativePath = pathContentStore.getState().pathContent.relativePath) => {
    const { resultList: [ { key: nextRelativePath, directoryList, fileList } ] } = await authFetchActionJSON(ACTION_TYPE.PATH_DIRECTORY_CONTENT, { key: relativePath || PATH_ROOT })
    pathContentStore.setState({ pathContent: { relativePath: nextRelativePath || PATH_ROOT, directoryList, fileList } })
  }

  const getLoadPathAsync = (pathContentStore) => async (relativePath) => doLoadPath(pathContentStore, relativePath)
  const getPathActionAsync = (pathContentStore) => async (batchList, actionType, key, keyTo) => {
    if (
      !key || // need at least one path
      keyTo === null || // canceled move or copy action
      ((actionType === ACTION_TYPE.PATH_COPY || actionType === ACTION_TYPE.PATH_RENAME) && (keyTo === key)) // skip noop
    ) return
    const output = await authFetchActionJSON(actionType, { key, keyTo, batchList })
    __DEV__ && console.log('output', output)
    await doLoadPath(pathContentStore)
  }
  const getPreviewFile = (pathContentStore, authUrl) => async (relativePath, fileName) => open(authUrl(
    `${URL_FILE_SERVE_ABBR}/${lazyEncodeURI(pathPush(relativePath, fileName))}`
  ))
  const getDownloadFile = (pathContentStore, authDownload) => async (relativePath, fileName) => authDownload(
    `${URL_FILE_SERVE_ABBR}/${lazyEncodeURI(pathPush(relativePath, fileName))}`,
    fileName
  )

  const renderPathContent = (pathContentStore, parentElement, loadPath, pathAction, previewFile, downloadFile) => {
    const { pathSortType, pathContent: { relativePath, directoryList, fileList } } = pathContentStore.getState()

    const selectToggleMap = {}
    const selectNameSet = new Set()

    const doSelectRemaining = () => {
      Object.entries(selectToggleMap).forEach(([ name, toggle ]) => !selectNameSet.has(name) && toggle())
      updateSelectStatus()
    }
    const doSelectNone = () => {
      selectNameSet.forEach((name) => selectToggleMap[ name ]())
      updateSelectStatus()
    }

    const TEXT_SELECT_NONE = '☐'
    const TEXT_SELECT_SOME = '☒'
    const TEXT_SELECT_ALL = '☑'
    const TEXT_BATCH = (text) => `🗃️${text}`

    const TEXT_COPY = '📋'
    const TEXT_RENAME = '✂️'
    const TEXT_DELETE = '🗑️'

    const TEXT_COMPRESS = '📥'
    const TEXT_EXTRACT = '📤'

    const selectPathPop = cE('button', { className: 'edit', innerText: '🔙..', onclick: () => loadPath(pathPop(relativePath)) })

    const selectEditSelectNone = cE('button', { className: 'edit', innerText: TEXT_BATCH(TEXT_SELECT_NONE), onclick: doSelectRemaining })
    const selectEditSelectSome = cE('button', { className: 'edit', innerText: TEXT_BATCH(TEXT_SELECT_SOME), onclick: doSelectRemaining })
    const selectEditSelectAll = cE('button', { className: 'edit', innerText: TEXT_BATCH(TEXT_SELECT_ALL), onclick: doSelectNone })

    const selectEditCopy = cE('button', { className: 'edit', innerText: TEXT_BATCH(TEXT_COPY), onclick: async () => pathAction([ ...selectNameSet ], ACTION_TYPE.PATH_COPY, relativePath, await withPromptModal(`Batch Copy ${selectNameSet.size} Path To`, relativePath)) })
    const selectEditRename = cE('button', { className: 'edit', innerText: TEXT_BATCH(TEXT_RENAME), onclick: async () => pathAction([ ...selectNameSet ], ACTION_TYPE.PATH_RENAME, relativePath, await withPromptModal(`Batch Rename ${selectNameSet.size} Path To`, relativePath)) })
    const selectEditDelete = cE('button', { className: 'edit', innerText: TEXT_BATCH(TEXT_DELETE), onclick: async () => (await withConfirmModal(`Batch Delete ${selectNameSet.size} Path In: ${pathName(relativePath)}?`)) && pathAction([ ...selectNameSet ], ACTION_TYPE.PATH_DELETE, relativePath) })

    const updateSelectStatus = () => aCL(qS('.select', ''), [
      relativePath !== PATH_ROOT && selectPathPop,
      !selectNameSet.size ? selectEditSelectNone : (selectNameSet.size < (directoryList.length + fileList.length)) ? selectEditSelectSome : selectEditSelectAll,
      selectNameSet.size && selectEditCopy,
      selectNameSet.size && selectEditRename,
      selectNameSet.size && selectEditDelete,
      cE('span', { className: 'name button', innerText: `${selectNameSet.size} selected` })
    ])

    const renderSelectButton = (name) => {
      selectToggleMap[ name ] = () => { // toggle select func
        const prevIsSelect = selectNameSet.has(name)
        selectNameSet[ prevIsSelect ? 'delete' : 'add' ](name)
        const isSelect = !prevIsSelect
        element.className = isSelect ? 'edit select' : 'edit'
        element.innerText = isSelect ? TEXT_SELECT_ALL : TEXT_SELECT_NONE
      }
      const element = cE('button', {
        className: 'edit',
        innerText: TEXT_SELECT_NONE,
        onclick: () => {
          selectToggleMap[ name ]()
          updateSelectStatus()
        }
      })
      return element
    }

    // const isWideL = window.innerWidth >= 800
    const editBlocker = (IS_READ_ONLY || window.innerWidth < 480) && []
    const wideMBlocker = (window.innerWidth < 640) && []
    const renderCommonEditList = (relativePath) => [
      cE('button', { className: 'edit', innerText: TEXT_COPY, onclick: async () => pathAction([ '' ], ACTION_TYPE.PATH_COPY, relativePath, await withPromptModal('Copy To', relativePath)) }),
      cE('button', { className: 'edit', innerText: TEXT_RENAME, onclick: async () => pathAction([ '' ], ACTION_TYPE.PATH_RENAME, relativePath, await withPromptModal('Rename To', relativePath)) }),
      cE('button', { className: 'edit', innerText: TEXT_DELETE, onclick: async () => (await withConfirmModal(`Delete path: ${relativePath}?`)) && pathAction([ '' ], ACTION_TYPE.PATH_DELETE, relativePath) })
    ]
    const createCompressButton = (relativePath, actionType, defaultExtension, extraMessage = '') => cE('button', {
      className: 'edit', innerText: TEXT_COMPRESS, // innerText: isWideL ? `${TEXT_COMPRESS}${defaultExtension}` : defaultExtension,
      onclick: async () => pathAction([ '' ], actionType, relativePath, await withPromptModal(`Compress To ${extraMessage}`, `${relativePath}.${defaultExtension}`))
    })
    const renderExtraCompressEdit = (relativePath) => IS_EXTRA_AUTO ? createCompressButton(relativePath, ACTION_TYPE.PATH_COMPRESS_AUTO, '7z', '(support 7z|xz|tar|fsp)')
      : IS_EXTRA_TAR ? createCompressButton(relativePath, ACTION_TYPE.PATH_COMPRESS_TAR, 'tgz')
        : null
    const renderExtraExtractEdit = (relativePath) => {
      let actionType
      if (IS_EXTRA_AUTO && REGEXP_EXTRACT_AUTO.test(relativePath)) actionType = ACTION_TYPE.PATH_EXTRACT_AUTO
      else if (IS_EXTRA_TAR && REGEXP_EXTRACT_TAR.test(relativePath)) actionType = ACTION_TYPE.PATH_EXTRACT_TAR
      return actionType && cE('button', {
        className: 'edit', innerText: TEXT_EXTRACT, // innerText: isWideL ? `${TEXT_EXTRACT}${relativePath.split('.').pop()}` : TEXT_EXTRACT,
        onclick: async () => pathAction([ '' ], actionType, relativePath, await withPromptModal('Extract To', `${relativePath}.content/`))
      })
    }
    const REGEXP_EXTRACT_AUTO = /\.(?:tar|tgz|tar\.gz|t7z|tar\.7z|txz|tar\.xz|7z|zip|fsp|fsp\.gz)$/
    const REGEXP_EXTRACT_TAR = /\.(?:tar|tgz|tar\.gz)$/

    parentElement.innerHTML = ''

    aCL(parentElement, [
      cE('h2', { innerText: pathName(relativePath) }),
      cE('h6', { innerText: `${directoryList.length} directory, ${fileList.length} file (${Format.binary(fileList.reduce((o, [ , size ]) => o + size, 0))}B)` }),
      cE('div', { className: 'select' }), // update later
      ...directoryList
        .sort((nameA, nameB) => SORT_FUNC[ pathSortType ]([ nameA ], [ nameB ]))
        .map((name) => cE('div', { className: 'directory' }, [
          !IS_READ_ONLY && renderSelectButton(name),
          cE('button', { className: 'name', innerText: `📁|${name}/`, onclick: () => loadPath(pathPush(relativePath, name)) }),
          ...(editBlocker || wideMBlocker || [ renderExtraCompressEdit(pathPush(relativePath, name)) ]),
          ...(editBlocker || renderCommonEditList(pathPush(relativePath, name)))
        ])),
      ...fileList
        .sort(SORT_FUNC[ pathSortType ])
        .map(([ name, size, mtimeMs ]) => cE('div', { className: 'file' }, [
          !IS_READ_ONLY && renderSelectButton(name),
          cE('span', { className: 'name button', innerText: `📄|${name} - ${new Date(mtimeMs).toLocaleString()}` }),
          cE('button', { className: 'edit', innerText: `${Format.binary(size)}B|💾`, onclick: () => downloadFile(relativePath, name) }),
          ...(editBlocker || wideMBlocker || [ renderExtraExtractEdit(pathPush(relativePath, name)) ]),
          cE('button', { className: 'edit', innerText: '🔍', onclick: () => previewFile(relativePath, name) }),
          ...(editBlocker || renderCommonEditList(pathPush(relativePath, name)))
        ]))
    ])

    !IS_READ_ONLY && updateSelectStatus()
  }

  return {
    initialPathContentState,
    authFetchActionJSON,
    cyclePathSortType,
    getLoadPathAsync,
    getPathActionAsync,
    getPreviewFile,
    getDownloadFile,
    renderPathContent
  }
}

export { pathContentStyle, initPathContent }
