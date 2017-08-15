import { DEFAULT_MIME, BASIC_EXTENSION_MAP } from 'source/common/module'

const muteEvent = (event) => {
  event.stopPropagation()
  event.preventDefault()
}
// onFileList should accept FileList (Array-like, contains File)
const addDragFileListListenerToElement = (element, onFileList) => {
  element.addEventListener('dragenter', muteEvent)
  element.addEventListener('dragover', muteEvent)
  element.addEventListener('drop', (event) => {
    muteEvent(event)
    const { files } = event.dataTransfer
    files && files.length && onFileList(files)
  })
}

const REGEXP_EXTENSION = /\.(\w+)$/
const getBlobMIMEType = (blob) => {
  if (blob.type) return blob.type
  const result = REGEXP_EXTENSION.exec(blob.name)
  return (result && result[ 1 ] && BASIC_EXTENSION_MAP[ result[ 1 ] ]) || DEFAULT_MIME
}

// // callback should accept String/ArrayBuffer +
// const parseFile = (blob, type) => new Promise((resolve, reject) => {
//   const fileReader = new window.FileReader()
//   fileReader.addEventListener('loadend', () => resolve({
//     data: fileReader.result,
//     type: DATA_TYPE[ type ]
//   }))
//
//   switch (type) {
//     case FILE_TYPE.TEXT:
//       fileReader.readAsText(blob) // [string]
//       break
//     case FILE_TYPE.DATA_URL:
//       fileReader.readAsDataURL(blob) // [string] as a URL representing the blob's data as a base64 encoded string
//       break
//     case FILE_TYPE.ARRAY_BUFFER:
//       fileReader.readAsArrayBuffer(blob) // [ArrayBuffer: typed array objects]
//       break
//     default:
//       __DEV__ && console.warn(false, `[parseFile] error fileType: ${type}`)
//       reject(new Error(`[parseFile] error fileType: ${type}`))
//       break
//   }
// })

export {
  addDragFileListListenerToElement,
  getBlobMIMEType
  // parseFile
}
