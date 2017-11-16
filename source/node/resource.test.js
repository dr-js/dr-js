import nodeModulePath from 'path'
import { loadScript } from './resource'

const { describe, it } = global

describe('Node.Resource', () => {
  it('loadScript()', (done) => {
    const scriptPath = nodeModulePath.join(__dirname, '../../example/resource/script.js')
    loadScript(scriptPath)
      .then(() => done())
      .catch((error) => done(error))
  })
})
