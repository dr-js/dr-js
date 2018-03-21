const { Blob, FileReader } = window

const createParseBlob = (methodName) => (blob) => new Promise((resolve, reject) => {
  const fileReader = new FileReader()
  fileReader.addEventListener('error', reject)
  fileReader.addEventListener('load', () => resolve(fileReader.result))
  fileReader[ methodName ](blob)
})
const parseBlobAsText = createParseBlob('readAsText')
const parseBlobAsDataURL = createParseBlob('readAsDataURL')
const parseBlobAsArrayBuffer = createParseBlob('readAsArrayBuffer')

export {
  Blob,
  parseBlobAsText,
  parseBlobAsDataURL,
  parseBlobAsArrayBuffer
}
