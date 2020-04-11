window.addContent('', `
<div class="flex-row box" style="overflow: auto; width: 100vw; max-height: 480px; justify-content: center; font-family: monospace;">
  <div class="flex-column" style="width: 240px;">
    <input id="bench-input" type="file">
    <p id="bench-info"></p>
    <button id="bench-clear">clear</button>
    <button id="bench-to-json">as JSON</button>
    <button id="bench-to-text">as Text</button>
    <button id="bench-to-image">as Image</button>
  </div>
  <div class="flex-column">
    <textarea id="bench-textarea" style="flex: 1; min-width: 240px;"></textarea>
  </div>
  <div class="flex-column">
    <img id="bench-img" src="#" style="object-fit: contain; max-width: 64vw; min-width: 240px; max-height: 92vh; min-height: 240px;">
  </div>
</div>
`, () => {
  const {
    qS,
    Dr: {
      Common: { Format: { binary }, String: { autoEllipsis } },
      Browser: {
        DOM: { applyReceiveFileListListener },
        Data: { Blob: { parseBlobAsText, parseBlobAsDataURL } }
      }
    }
  } = window

  const benchInput = qS('#bench-input')
  const benchTextarea = qS('#bench-textarea')
  const benchImg = qS('#bench-img')
  const benchInfo = qS('#bench-info')

  qS('#bench-clear').onclick = () => { resetBench() }
  qS('#bench-to-json').onclick = async () => {
    const fileBlob = benchInput.files[ 0 ]
    if (!fileBlob) return
    try {
      const object = JSON.parse(await parseBlobAsText(fileBlob))
      const text = JSON.stringify(object, null, 2)
      benchTextarea.value = autoEllipsis(text, 1024, 512, 128)
      window.BENCH.OBJECT = object
      window.BENCH.TEXT = text
    } catch (error) { benchTextarea.value = `${error.stack || error}` }
  }
  qS('#bench-to-text').onclick = async () => {
    const fileBlob = benchInput.files[ 0 ]
    if (!fileBlob) return
    const text = await parseBlobAsText(fileBlob)
    benchTextarea.value = autoEllipsis(text, 1024, 512, 128)
    window.BENCH.TEXT = text
  }
  qS('#bench-to-image').onclick = async () => {
    const fileBlob = benchInput.files[ 0 ]
    if (!fileBlob) return
    const dataURL = await parseBlobAsDataURL(fileBlob)
    benchImg.src = dataURL
    window.BENCH.IMAGE_ELEMENT = benchImg
    window.BENCH.DATA_URL = dataURL
  }

  const resetBench = () => {
    benchInput.value = ''
    benchTextarea.value = ''
    benchImg.src = '#'
    window.BENCH = {
      FILE_BLOB: undefined,
      IMAGE_ELEMENT: undefined,
      TEXT: '',
      OBJECT: undefined,
      DATA_URL: ''
    }
    updateBenchInput()
  }

  const updateBenchInput = () => {
    const fileBlob = benchInput.files[ 0 ]
    benchInfo.innerText = fileBlob
      ? `file: ${fileBlob.name} (${binary(fileBlob.size)}B)`
      : 'select a file above, or drop on the page'
    window.BENCH.FILE_BLOB = fileBlob
  }

  benchInput.addEventListener('change', updateBenchInput)
  applyReceiveFileListListener(document.body, (fileList) => {
    benchInput.files = fileList
    updateBenchInput()
  })
  resetBench()
})
