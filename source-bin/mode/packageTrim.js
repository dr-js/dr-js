import { indentLineList } from 'source/common/string.js'
import { trimFileNodeModules, trimFileRubyGem } from 'source/dev/node/package/Trim.js'

const doPackageTrimNodeModules = async ({ pathList = [], log }) => {
  for (const path of pathList) {
    log && log(`- [trim|node-modules]: ${path}`)
    const trimFileList = await trimFileNodeModules(path)
    log && log(`  - trimmed ${trimFileList.length} file`)
    log && trimFileList.length && log(indentLineList(trimFileList, '  - '))
  }
}
const doPackageTrimRubyGem = async ({ pathList = [], log }) => {
  for (const path of pathList) {
    log && log(`- [trim|ruby-gem]: ${path}`)
    const trimFileList = await trimFileRubyGem(path)
    log && log(`  - trimmed ${trimFileList.length} file`)
    log && trimFileList.length && log(indentLineList(trimFileList, '  - '))
  }
}

export { doPackageTrimNodeModules, doPackageTrimRubyGem }
