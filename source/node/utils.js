import Dr from '../Dr'

import nodeModuleVm from 'vm'
import nodeModuleFs from 'fs'

export function loadScriptSync (src) {
  const filePath = Dr.getLocalPath(src)
  try {
    const data = nodeModuleFs.readFileSync(filePath)
    nodeModuleVm.runInThisContext(data.toString(), { filename: filePath })
  } catch (error) {
    Dr.logError(error, '[loadScript] Failed to load Script', filePath)
  }
}

export function loadJSONSync (src) {
  const filePath = Dr.getLocalPath(src)
  const fileString = nodeModuleFs.readFileSync(filePath, { encoding: 'utf8' })
  const stringList = fileString.split('\n').forEach((v) => v.replace(/\/\/.*/, '')) // support single line comment like '//...'
  return JSON.parse(stringList.join('\n'))
}
