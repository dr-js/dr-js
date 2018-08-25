window.addContent(``, `
<div class="flex-column" style="overflow: auto; width: 100vw; align-items: center; font-family: monospace;">
  <input id="bench-input" type="file">

  <div class="flex-row">
    <div class="flex-column box">
      <span id="bench-info">select a file</span>
      <button id="bench-to-json">as JSON</button>
      <button id="bench-to-text">as Text</button>
      <button id="bench-to-image">as Image</button>
    </div>
      <textarea id="bench-textarea"></textarea>
      <img id="bench-img" style="object-fit: contain; max-width: 92vw; max-height: 92vh;">
  </div>
</div>
`, () => {
  const {
    qS,
    Dr: {
      Common: { Format: { binary, stringAutoEllipsis } },
      Browser: {
        DOM: { applyDragFileListListener },
        Data: { Blob: { parseBlobAsText, parseBlobAsDataURL } }
      }
    }
  } = window

  const benchInput = qS('#bench-input')
  const benchTextarea = qS('#bench-textarea')
  const benchImg = qS('#bench-img')
  const benchInfo = qS('#bench-info')

  qS('#bench-to-json').onclick = async () => {
    const fileBlob = benchInput.files[ 0 ]
    if (!fileBlob) return
    const text = await parseBlobAsText(fileBlob)
    benchTextarea.value = stringAutoEllipsis(text, 1024, 512, 128)
    window.BENCH_TEXT = text
    window.BENCH_JSON = JSON.parse(text)
  }
  qS('#bench-to-text').onclick = async () => {
    const fileBlob = benchInput.files[ 0 ]
    if (!fileBlob) return
    const text = await parseBlobAsText(fileBlob)
    benchTextarea.value = stringAutoEllipsis(text, 1024, 512, 128)
    window.BENCH_TEXT = text
  }
  qS('#bench-to-image').onclick = async () => {
    const fileBlob = benchInput.files[ 0 ]
    if (!fileBlob) return
    const dataURL = await parseBlobAsDataURL(fileBlob)
    benchImg.src = dataURL
    window.BENCH_DATAURL = dataURL
  }

  const updateBenchInput = () => {
    const fileBlob = benchInput.files[ 0 ]
    benchInfo.innerText = fileBlob ? `file: ${fileBlob.name} (${binary(fileBlob.size)}B)` : 'select a file'
    window.BENCH_FILE = fileBlob
  }

  benchInput.addEventListener('change', updateBenchInput)
  applyDragFileListListener(document.body, (fileList) => {
    benchInput.files = fileList
    updateBenchInput()
  })
})
