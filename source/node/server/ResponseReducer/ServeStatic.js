import nodeModuleFs from 'fs'
import nodeModulePath from 'path'

const createResponseReducerServeStatic = (staticRoot) => (store, filePath) => new Promise((resolve, reject) => {
  filePath = nodeModulePath.join(staticRoot, filePath)
  nodeModuleFs.stat(filePath, (error, stats) => {
    if (error) return reject(error)
    if (!stats.isFile()) return reject(new Error(`[StaticFileServer] not file: ${filePath}`))
    store.response.setHeader('Content-Length', stats.size)
    store.response.setHeader('Content-Type', 'text/plain')
    const fileStream = nodeModuleFs.createReadStream(filePath)
    fileStream.on('error', reject)
    fileStream.on('end', () => resolve(store))
    fileStream.pipe(store.response)
  })
})

export {
  createResponseReducerServeStatic
}
