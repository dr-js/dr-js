const FILE_TYPE = {
  TEXT: 'TEXT', // [String]
  DATA_URL: 'DATA_URL', // [String] as a URL representing the file's data as a base64 encoded string
  ARRAY_BUFFER: 'ARRAY_BUFFER' // [ArrayBuffer: typed array objects]
}
const DATA_TYPE = {
  TEXT: 'String', // [String]
  DATA_URL: 'String', // [String] as a URL representing the file's data as a base64 encoded string
  ARRAY_BUFFER: 'ArrayBuffer' // [ArrayBuffer: typed array objects]
}

// callback should accept String/ArrayBuffer +
const parseFile = (file, fileType) => new Promise((resolve, reject) => {
  const fileReader = new window.FileReader()
  fileReader.addEventListener('loadend', () => resolve({
    data: fileReader.result,
    type: DATA_TYPE[ fileType ]
  }))

  switch (fileType) {
    case FILE_TYPE.TEXT:
      fileReader.readAsText(file) // [string]
      break
    case FILE_TYPE.DATA_URL:
      fileReader.readAsDataURL(file) // [string] as a URL representing the file's data as a base64 encoded string
      break
    case FILE_TYPE.ARRAY_BUFFER:
      fileReader.readAsArrayBuffer(file) // [ArrayBuffer: typed array objects]
      break
    default:
      __DEV__ && console.warn(false, `[FileOperation][parseFile] error fileType: ${fileType}`)
      reject(new Error(`[FileOperation][parseFile] error fileType: ${fileType}`))
      break
  }
})

function getFileType (file) {
  const fileType = file.type
  if (fileType) {
    // check MIME type
    if (fileType.includes('text')) return FILE_TYPE.TEXT
    if (fileType.includes('image')) return FILE_TYPE.DATA_URL
    if (fileType.includes('video')) return FILE_TYPE.ARRAY_BUFFER
    if (fileType.includes('audio')) return FILE_TYPE.ARRAY_BUFFER

    if (fileType.includes('xml')) return FILE_TYPE.TEXT
    if (fileType.includes('html')) return FILE_TYPE.TEXT
    if (fileType.includes('json')) return FILE_TYPE.TEXT
    if (fileType.includes('script')) return FILE_TYPE.TEXT
  }

  const fileName = file.name
  if (fileName) {
    // check extension
    if (fileType.includes('.js')) return FILE_TYPE.TEXT
    if (fileType.includes('.json')) return FILE_TYPE.TEXT
    if (fileType.includes('.txt')) return FILE_TYPE.TEXT
    if (fileType.includes('.xml')) return FILE_TYPE.TEXT
    if (fileType.includes('.html')) return FILE_TYPE.TEXT
    if (fileType.includes('.css')) return FILE_TYPE.TEXT

    if (fileType.includes('.png')) return FILE_TYPE.DATA_URL
    if (fileType.includes('.jpg')) return FILE_TYPE.DATA_URL
    if (fileType.includes('.gif')) return FILE_TYPE.DATA_URL
    if (fileType.includes('.bmp')) return FILE_TYPE.DATA_URL

    if (fileType.includes('.mpeg')) return FILE_TYPE.ARRAY_BUFFER
    if (fileType.includes('.mp3')) return FILE_TYPE.ARRAY_BUFFER
    if (fileType.includes('.mp4')) return FILE_TYPE.ARRAY_BUFFER
  }

  return null
}

// callback should accept FileList (Array-like, contains File)
function addFileDragListenerToElement (element, callback) {
  element.addEventListener('dragenter', muteEvent)
  element.addEventListener('dragover', muteEvent)
  element.addEventListener('drop', function (event) {
    muteEvent(event)
    event.dataTransfer &&
    event.dataTransfer.files &&
    event.dataTransfer.files.length > 0 &&
    callback(event.dataTransfer.files)
  })
}

function muteEvent (event) {
  event.stopPropagation()
  event.preventDefault()
}

export {
  FILE_TYPE,
  DATA_TYPE,

  parseFile,
  getFileType,
  addFileDragListenerToElement
}