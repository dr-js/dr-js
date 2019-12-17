const { Blob, FileReader } = window

// TODO: upgrade to Blob reading, check: https://youtu.be/eCGW0FKZ1gg?t=238
//   or Response, like: new Response(blob).text() // Chrome42/Edge15/Firefox39/Safari10.1
//   though currently FileReader has wider support // Chrome7/Edge0/Firefox3.6/Safari6
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
