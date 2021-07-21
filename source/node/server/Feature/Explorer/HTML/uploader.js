const initUploader = (
  URL_FILE_UPLOAD,
  authFetch
) => {
  const {
    document,
    qS, cE,
    Dr: {
      Common: {
        Format,
        Time: { createStepper },
        Error: { catchAsync },
        Function: { withRetryAsync },
        Immutable: { Object: { objectSet, objectDelete, objectPickKey } }
      },
      Browser: { Module: { FileChunkUpload: { uploadFileByChunk } } }
    }
  } = window

  const initialUploaderState = {
    isActive: false,
    uploadFileList: [ /* { key, fileBlob } */ ],
    uploadProgress: { /* [key]: progress[0,1] */ },
    uploadStatus: ''
  }

  const getUploadFileAsync = (uploaderStore, onUploadComplete) => async () => {
    const { uploadFileList: fileList } = uploaderStore.getState()
    uploaderStore.setState({ uploadStatus: 'uploading' })
    const stepper = createStepper()
    const uploadStatusList = []
    for (const { key, fileBlob } of fileList) {
      const onProgress = (current, total) => uploaderStore.setState({
        uploadProgress: objectSet(uploaderStore.getState().uploadProgress, key, total ? (current / total) : 1)
      })
      const { error } = await catchAsync(uploadFileByChunk, {
        fileBlob,
        key,
        onProgress,
        uploadChunk: async (arrayBufferPacket, { key, chunkIndex, chunkTotal }) => withRetryAsync(
          async () => authFetch(URL_FILE_UPLOAD, { method: 'POST', body: arrayBufferPacket }),
          4, // maxRetry,
          1000 // wait
        )
      })
      error && uploadStatusList.push(`Error upload '${key}': ${error.stack || (error.target && error.target.error) || error}`)
    }
    uploadStatusList.push(`Done in ${Format.time(stepper())} for ${fileList.length} file`)
    {
      const { uploadFileList, uploadProgress } = uploaderStore.getState()
      uploaderStore.setState({
        uploadFileList: uploadFileList.filter((v) => !fileList.includes(v)),
        uploadProgress: objectPickKey(uploadProgress, Object.keys(uploadProgress).filter((key) => !fileList.find((v) => v.key === key))),
        uploadStatus: uploadStatusList.join('\n')
      })
    }
    await onUploadComplete()
  }

  const getAppendUploadFileList = (uploaderStore, getExtraState) => (fileList = []) => {
    const { shouldAppend, relativePath } = getExtraState()
    if (!shouldAppend) return

    fileList = Array.from(fileList) // NOTE: convert FileList, for Edge support, do not use `...fileList`
    const dedupSet = new Set()
    const uploadFileList = [
      ...fileList.map((fileBlob) => ({ key: `${relativePath}/${fileBlob.name}`, fileBlob })),
      ...uploaderStore.getState().uploadFileList
    ].filter(({ key }) => dedupSet.has(key) ? false : dedupSet.add(key))
    const uploadProgress = uploadFileList.reduce(
      (uploadProgress, { key }) => objectDelete(uploadProgress, key),
      uploaderStore.getState().uploadProgress
    )
    uploaderStore.setState({ isActive: true, uploadFileList, uploadProgress, uploadStatus: '' })
  }

  const renderUploader = (uploaderStore, uploadFile, appendUploadFileList) => {
    const { isActive, uploadFileList, uploadProgress, uploadStatus } = uploaderStore.getState()
    let uploadBlockDiv = qS('#upload-panel')

    if (!isActive) return uploadBlockDiv && uploadBlockDiv.remove()

    uploadBlockDiv = uploadBlockDiv || document.body.appendChild(cE('div', {
      id: 'upload-panel',
      style: 'overflow: hidden; position: absolute; bottom: 0; right: 0; margin: 8px; background: var(--ct-bg-n); box-shadow: 0 0 2px 0 #888;',
      innerHTML: [
        '<div style="overflow-x: auto; display: flex; flex-flow: row nowrap; box-shadow: 0 0 8px 0 #888;">',
        ...[
          '<button class="edit">Upload</button>',
          '<button class="edit">Clear</button>',
          '<div style="flex: 1;"></div>',
          '<button class="edit" style="align-self: flex-end;">❌</button>'
        ],
        '</div>',
        '<label>Select file: <input type="file" multiple/></label>',
        '<pre style="overflow: auto; padding: 8px 4px; max-width: 80vw; max-height: 60vh; min-height: 64px; color: #888;"></pre>'
      ].join('<br />')
    }))

    uploadBlockDiv.querySelector('pre').innerText = [
      ...uploadFileList.map(({ key, fileBlob: { size } }) =>
        `[${Format.percent(uploadProgress[ key ] || 0).padStart(7, ' ')}] - ${key} (${Format.binary(size)}B)`
      ),
      uploadStatus
    ].filter(Boolean).join('\n') || 'or drop file here'

    const [ uploadButton, clearButton, removeBlockButton ] = uploadBlockDiv.querySelectorAll('button')
    uploadButton.addEventListener('click', uploadFile)
    clearButton.addEventListener('click', () => uploaderStore.setState({ ...initialUploaderState, isActive: true }))
    removeBlockButton.addEventListener('click', () => uploaderStore.setState({ isActive: false }))

    const uploadFileListInput = uploadBlockDiv.querySelector('input[type="file"]')
    uploadFileListInput.addEventListener('change', () => appendUploadFileList(uploadFileListInput.files))
  }

  return {
    initialUploaderState,
    getUploadFileAsync,
    getAppendUploadFileList,
    renderUploader
  }
}

export { initUploader }
