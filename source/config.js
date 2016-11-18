export const GLOBAL = (typeof (window) !== 'undefined' ? window : (typeof (global) !== 'undefined' ? global : this)) // normally window, global or this for a sandbox?
export const ENVIRONMENT = (() => {
  const isBrowser = (typeof (GLOBAL.window) !== 'undefined' && typeof (GLOBAL.document) !== 'undefined')
  const isNode = (typeof (GLOBAL.process) !== 'undefined' && typeof (GLOBAL.process.versions) !== 'undefined' && GLOBAL.process.versions.node)
  const isCordova = (typeof (GLOBAL.cordova) !== 'undefined')
  return isCordova ? 'cordova'
    : isNode ? 'node'
    : isBrowser ? 'browser'
    : 'unknown'
})()

console.log('detected', ENVIRONMENT)

// ENVIRONMENT dependent
const { loadScript, nodeExePath, nodeStartScriptPath, getLocalPath, startREPL } = (() => {
  switch (ENVIRONMENT) {
    case 'browser':
    case 'cordova':
      return {
        loadScript: (src) => new Promise((resolve) => {
          const element = document.createElement('script')
          element.type = 'text/javascript'
          element.async = false
          element.src = src
          element.onload = () => resolve(element)
          const existElement = document.getElementsByTagName('script')[ 0 ]
          existElement.parentNode.insertBefore(element, existElement)
        })
      }
    case 'node':
      const nodeModuleFs = require('fs')
      const nodeModuleVm = require('vm')
      const nodeModulePath = require('path')
      const nodeModuleRepl = require('repl')
      return {
        nodeExePath: GLOBAL.process.argv[ 0 ],
        nodeStartScriptPath: nodeModulePath.resolve(GLOBAL.process.cwd(), nodeModulePath.dirname(GLOBAL.process.argv[ 1 ])),
        getLocalPath: (relativePath) => nodeModulePath.resolve(nodeStartScriptPath, relativePath),
        startREPL: () => nodeModuleRepl.start({
          prompt: 'Dr> ',
          input: GLOBAL.process.stdin,
          output: GLOBAL.process.stdout,
          useGlobal: true
        }),

        loadScript: (src) => new Promise((resolve, reject) => {
          if (src.search('://') !== -1) return console.log([ '[loadScript] not support web content yet...', src ])
          const localPath = getLocalPath(src)
          try {
            nodeModuleFs.readFile(localPath, function (error, data) {
              if (error) throw error
              if (!data) throw new Error('failed to read file data:' + data)
              nodeModuleVm.runInThisContext(data.toString(), { filename: localPath })
              resolve(data)
            })
          } catch (error) {
            reject(error)
          }
        })
      }
  }
})()
export { loadScript, nodeExePath, nodeStartScriptPath, getLocalPath, startREPL }

export function loadScriptByList (srcList) {
  const loopLoad = () => new Promise((resolve) => (srcList.length <= 0) ? resolve() : loadScript(srcList.shift()).then(loopLoad))
  return loopLoad() // start loop
}

export const onNextProperUpdate = GLOBAL.requestAnimationFrame
  ? GLOBAL.requestAnimationFrame
  : (callback) => setTimeout(callback, 1000 / 60)

export default {
  GLOBAL,
  ENVIRONMENT,

  loadScript,
  loadScriptByList,
  onNextProperUpdate,

  nodeExePath,
  nodeStartScriptPath,
  getLocalPath,
  startREPL
}
