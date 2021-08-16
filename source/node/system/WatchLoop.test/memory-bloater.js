const [
  ,
  ,
  MAX_LENGTH_STRING = '256'
] = process.argv

const bufferList = []
const maxLength = parseInt(MAX_LENGTH_STRING)

setInterval(() => {
  const { length } = bufferList
  console.log(`[${process.pid}] ${length}`)
  length < maxLength && bufferList.push(Buffer.alloc(2 ** 20, length % 256)) // 1MiB
}, 10)
