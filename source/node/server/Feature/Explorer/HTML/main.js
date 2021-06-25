import { COMMON_LAYOUT, COMMON_STYLE, COMMON_SCRIPT } from 'source/common/module/HTML.js'
import { DR_BROWSER_SCRIPT_TAG } from 'source/node/server/function.js'

import { initAuthMask } from 'source/node/server/Feature/Auth/HTML.js'
import { initModal } from 'source/node/server/Feature/@/HTML/Modal.js'
import { initLoadingMask } from 'source/node/server/Feature/@/HTML/LoadingMask.js'

import { pathContentStyle, initPathContent } from './pathContent.js'
import { initUploader } from './uploader.js'

const getHTML = ({
  URL_AUTH_CHECK_ABBR, URL_ACTION_JSON_ABBR, URL_FILE_SERVE_ABBR, URL_FILE_UPLOAD,
  IS_SKIP_AUTH, IS_READ_ONLY, IS_EXTRA_TAR, IS_EXTRA_AUTO,
  ACTION_TYPE
}) => COMMON_LAYOUT([
  '<title>Explorer</title>',
  COMMON_STYLE(),
  mainStyle,
  pathContentStyle
], [
  '<div id="control-panel" style="overflow-x: auto; white-space: nowrap; box-shadow: 0 0 8px 0 #888;"></div>',
  '<div id="main-panel" style="position: relative; overflow: auto; flex: 1; min-height: 0;"></div>',
  COMMON_SCRIPT({
    INIT: [ // NOTE: shorter after minify
      URL_AUTH_CHECK_ABBR, URL_ACTION_JSON_ABBR, URL_FILE_SERVE_ABBR, URL_FILE_UPLOAD,
      IS_SKIP_AUTH, IS_READ_ONLY, IS_EXTRA_TAR, IS_EXTRA_AUTO,
      ACTION_TYPE
    ],
    initModal, initLoadingMask, initAuthMask, initPathContent, initUploader,
    onload: onLoadFunc
  }),
  DR_BROWSER_SCRIPT_TAG()
])

const mainStyle = `<style>
* { font-family: monospace; }
</style>`

const onLoadFunc = () => {
  const {
    document, URL, location,
    qS, cE, aCL,
    INIT: [
      URL_AUTH_CHECK_ABBR, URL_ACTION_JSON_ABBR, URL_FILE_SERVE_ABBR, URL_FILE_UPLOAD,
      IS_SKIP_AUTH, IS_READ_ONLY, IS_EXTRA_TAR, IS_EXTRA_AUTO,
      ACTION_TYPE
    ],
    initModal, initLoadingMask, initAuthMask, initPathContent, initUploader,
    Dr: {
      Common: { String: { lazyEncodeURI }, Immutable: { StateStore: { createStateStore } } },
      Browser: {
        DOM: { applyReceiveFileListListener },
        Module: { HistoryStateStore: { createHistoryStateStore } }
      }
    }
  } = window

  const initExplorer = async ({ authRevoke, authUrl, authFetch, authDownload }) => {
    const { withAlertModal, withConfirmModal, withPromptModal } = initModal()
    const { initialLoadingMaskState, wrapLossyLoading, renderLoadingMask } = initLoadingMask()
    const { initialPathContentState, authFetchActionJSON, cyclePathSortType, getLoadPathAsync, getPathActionAsync, getPreviewFile, getDownloadFile, renderPathContent } = initPathContent(
      URL_ACTION_JSON_ABBR, URL_FILE_SERVE_ABBR,
      IS_READ_ONLY, IS_EXTRA_TAR, IS_EXTRA_AUTO,
      ACTION_TYPE,
      authFetch, withConfirmModal, withPromptModal
    )
    const { initialUploaderState, getUploadFileAsync, getAppendUploadFileList, renderUploader } = IS_READ_ONLY ? {} : initUploader(
      URL_FILE_UPLOAD,
      IS_READ_ONLY ? () => { throw new Error('deny file upload, read only') } : authFetch
    )

    const loadingMaskStore = createStateStore(initialLoadingMaskState)
    const pathContentStore = createStateStore(initialPathContentState)
    const uploaderStore = !IS_READ_ONLY && createStateStore(initialUploaderState)

    const loadPathAsync = getLoadPathAsync(pathContentStore)

    const loadPath = wrapLossyLoading(loadingMaskStore, loadPathAsync)
    const pathAction = wrapLossyLoading(loadingMaskStore, getPathActionAsync(pathContentStore))
    const previewFile = getPreviewFile(pathContentStore, authUrl)
    const downloadFile = getDownloadFile(pathContentStore, authDownload)
    const uploadFile = !IS_READ_ONLY && wrapLossyLoading(loadingMaskStore, getUploadFileAsync(uploaderStore, loadPathAsync))
    const showStorageStatus = !IS_READ_ONLY && wrapLossyLoading(loadingMaskStore, async () => {
      const { status } = await authFetchActionJSON(ACTION_TYPE.STATUS_SERVER_COMMON)
      await withAlertModal(status)
    })
    const appendUploadFileList = !IS_READ_ONLY && getAppendUploadFileList(uploaderStore, () => ({
      shouldAppend: !loadingMaskStore.getState().isLoading,
      relativePath: pathContentStore.getState().pathContent.relativePath
    }))
    const createNewDirectory = async () => pathAction(
      [ await withPromptModal('Directory Name', `new-directory-${Date.now().toString(36)}`) ], // TODO: cancel will still fetch and cause server 400
      ACTION_TYPE.PATH_DIRECTORY_CREATE,
      pathContentStore.getState().pathContent.relativePath
    )
    const updateSort = () => { qS('#button-sort').innerText = `Sort: ${pathContentStore.getState().pathSortType}` }
    const cycleSort = () => {
      cyclePathSortType(pathContentStore)
      updateSort()
    }

    const historyStateStore = createHistoryStateStore()
    const historyStateListener = (url) => loadPath(decodeURIComponent((new URL(url)).hash.slice(1)))
    historyStateStore.subscribe(historyStateListener)
    const loadPathWithHistoryState = (relativePath = pathContentStore.getState().pathContent.relativePath) => {
      const urlObject = new URL(historyStateStore.getState())
      urlObject.hash = `#${lazyEncodeURI(relativePath)}`
      historyStateStore.setState(String(urlObject))
    }

    loadingMaskStore.subscribe(() => renderLoadingMask(loadingMaskStore))
    pathContentStore.subscribe(() => renderPathContent(pathContentStore, qS('#main-panel'), loadPathWithHistoryState, pathAction, previewFile, downloadFile))
    !IS_READ_ONLY && uploaderStore.subscribe(() => renderUploader(uploaderStore, uploadFile, appendUploadFileList))

    aCL(qS('#control-panel'), [
      cE('button', { innerText: 'To Root', onclick: () => loadPathWithHistoryState('.') }), // NOTE: using `loadPath` will skip update URL
      cE('button', { innerText: 'Refresh', onclick: () => loadPath(pathContentStore.getState().pathContent.relativePath) }),
      cE('button', { id: 'button-sort', onclick: cycleSort }),
      ...(IS_READ_ONLY ? [] : [
        cE('span', { innerText: '|' }),
        cE('button', { innerText: 'New Directory', onclick: createNewDirectory }),
        cE('button', { innerText: 'Toggle Upload', onclick: () => uploaderStore.setState({ isActive: !uploaderStore.getState().isActive }) }),
        cE('span', { innerText: '|' }),
        cE('button', { innerText: 'Storage Status', onclick: () => showStorageStatus() }),
        !IS_SKIP_AUTH && cE('button', { innerText: 'Auth Revoke', onclick: () => authRevoke().then(() => location.reload()) })
      ])
    ])

    !IS_READ_ONLY && applyReceiveFileListListener(document.body, (fileList) => appendUploadFileList(fileList))
    historyStateListener(historyStateStore.getState())
    updateSort()

    if (__DEV__) window.DEBUG = { loadingMaskStore, pathContentStore, uploaderStore }
  }

  initAuthMask({
    IS_SKIP_AUTH,
    URL_AUTH_CHECK_ABBR,
    onAuthPass: initExplorer
  })
}

export { getHTML }
