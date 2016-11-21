import nodeModuleAssert from 'assert'
import nodeModulePath from 'path'
import '../Dr.js'

const { Dr } = global

describe('Dr.js', () => {
  describe('Extend', () => {
    it('GLOBAL should be global', () => {
      nodeModuleAssert.equal(Dr.GLOBAL, global)
    })

    it('ENVIRONMENT should be node', () => {
      nodeModuleAssert.equal(Dr.ENVIRONMENT, 'node')
    })

    // console.log(Dr.nodeExePath)
    // console.log(Dr.nodeStartScriptPath)
    // console.log(nodeModulePath.join(__dirname, '../example/script.js'))
    const scriptPath = nodeModulePath.join(__dirname, '../example/script.js')

    it('loadScript()', (done) => {
      Dr.loadScript(scriptPath)
        .then(() => { done() })
        .catch((error) => { done(error) })
    })

    it('loadScriptByList()', (done) => {
      Dr.loadScriptByList([ scriptPath, scriptPath, scriptPath ])
        .then((dataList) => {
          nodeModuleAssert.equal(dataList.length, 3)
          done()
        })
        .catch((error) => { done(error) })
    })

    it('onNextProperUpdate()', (done) => {
      Dr.onNextProperUpdate(() => done())
      setTimeout(() => done('timeout'), 500)
    })

    it('assert()', () => {
      nodeModuleAssert.doesNotThrow(() => Dr.assert(true, 'safe'))
      nodeModuleAssert.throws(() => Dr.assert(false, 'danger'))
    })

    it('pick()', () => {
      const source = { a: 1, b: 2 }
      nodeModuleAssert.equal(Dr.pick(source, 'a'), 1)
      nodeModuleAssert.notEqual(source.a, 1)
    })
  })
  // describe('Module', () => {
  // })
})

describe('Array', () => {
  describe('#indexOf()', () => {
    it('should return -1 when the value is not present', () => {
      nodeModuleAssert.equal(-1, [ 1, 2, 3 ].indexOf(4))
    })
  })
})