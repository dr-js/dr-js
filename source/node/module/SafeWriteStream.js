import nodeModuleFs from 'fs'

const DEFAULT_ON_ERROR = (error) => {
  console.warn(error)
  throw error
}

// async write normally, sync write on emergency
const createSafeWriteStream = ({ pathOutputFile, onError = DEFAULT_ON_ERROR }) => {
  const writeSet = new Set() // pending log in write stream
  const writeStream = nodeModuleFs.createWriteStream(pathOutputFile, { flags: 'a' })

  writeStream.on('error', onError)

  const write = (writeString) => {
    if (!writeString) return
    writeSet.add(writeString)
    writeStream.write(writeString, () => writeSet.delete(writeString))
  }

  const end = () => {
    writeStream.destroy() // added in node v8.0.0, as end() will not close the stream immediately
    writeSet.size !== 0 && nodeModuleFs.appendFileSync(pathOutputFile, Array.from(writeSet).join(''))
    writeSet.clear()
  }

  return { write, end }
}

export { createSafeWriteStream }
