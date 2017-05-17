import nodeModuleAssert from 'assert'
import nodeModulePath from 'path'

import * as Dr from '../library/Dr.node' // '../library/Dr'

const { describe, it } = global

console.log('Test import', Object.keys(Dr))

describe('Array', () => {
  describe('#indexOf()', () => {
    it('should return -1 when the value is not present', () => {
      nodeModuleAssert.equal(-1, [ 1, 2, 3 ].indexOf(4))
    })
  })
})

describe('Dr', () => {
  describe('Env', () => {
    const { Env } = Dr
    it('Env.global equal global in node', () => nodeModuleAssert.equal(Env.global, global))
    it('Env.environmentName should be node', () => nodeModuleAssert.equal(Env.environmentName, 'node'))
    it('Env.assert', () => {
      nodeModuleAssert.doesNotThrow(() => Env.assert(true, 'safe'))
      nodeModuleAssert.throws(() => Env.assert(false, 'danger'))
    })
  })

  describe('Common', () => {
    const { Common } = Dr
    describe('Time', () => {
      const { Time } = Common
      it('Time.onNextProperUpdate()', (done) => {
        Time.onNextProperUpdate(() => done())
        setTimeout(() => done('timeout'), 500)
      })
    })
  })

  describe('Node', () => {
    const { Node } = Dr
    describe('Resource', () => {
      const { Resource } = Node

      // console.log(Dr.PATH_NODE_EXE)
      // console.log(Dr.PATH_NODE_START_SCRIPT)
      // console.log(nodeModulePath.join(__dirname, '../example/script.js'))
      const scriptPath = nodeModulePath.join(__dirname, '../example/script.js')

      it('loadScript()', (done) => {
        Resource.loadScript(scriptPath)
          .then(() => done())
          .catch((error) => done(error))
      })

      // it('loadScriptByList()', (done) => {
      //   Resource.loadScriptByList([ scriptPath, scriptPath, scriptPath ])
      //     .then((dataList) => {
      //       nodeModuleAssert.equal(dataList.length, 3)
      //       done()
      //     })
      //     .catch((error) => { done(error) })
      // })
    })
  })
})
