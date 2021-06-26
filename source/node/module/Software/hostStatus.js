import { binary } from 'source/common/format.js'
import { isString, isBasicFunction } from 'source/common/check.js'
import { runStdout } from 'source/node/run.js'
import { describeSystemStatus } from 'source/node/system/Status.js'

// TODO: allow user change || overwrite commands

const IS_WIN32 = process.platform === 'win32'
const IS_DARWIN = process.platform === 'darwin'

const COMMON_HOST_STATUS_COMMAND_LIST = [
  // [ title, ...tryList ]
  [ 'Disk', async (rootPath) => {
    if (IS_WIN32) { // win32 alternative, sample stdout: `27 Dir(s)  147,794,321,408 bytes free`
      const freeByteString = (await runQuick('dir | find "bytes free"', rootPath)) // TODO: this needs shell (cmd.exe) change to `cmd.exe /C dir`?
        .match(/([\d,]+) bytes/)[ 1 ]
        .replace(/\D/g, '')
      return `${binary(Number(freeByteString))}B free storage`
    } else {
      const diskStatus = await runQuick('df -h .', rootPath)
      if (!diskStatus.includes('/dev/')) return diskStatus // on remote-mount fs, skip `du` check (may be slow)
      return [ diskStatus, 'Usage', await runQuick('du -hd1', rootPath) ].join('\n')
    }
  } ],
  !IS_WIN32 && [ 'Network', 'vnstat -s' ],
  [ 'System', IS_DARWIN ? 'top -l1 -n0' : 'top -bn1 | head -n5', () => describeSystemStatus() ],
  [ 'Time', () => new Date().toISOString() ]
].filter(Boolean)

const runQuick = async (command, rootPath) => String(await runStdout([ command ], { cwd: rootPath, shell: true }))

const runStatusCommand = async (statusCommand, rootPath) => {
  let output = ''
  if (isString(statusCommand)) output = await runQuick(statusCommand, rootPath)
  else if (isBasicFunction(statusCommand)) output = await statusCommand(rootPath)
  return output
}

const getCommonHostStatus = async (rootPath, statusCommandList = COMMON_HOST_STATUS_COMMAND_LIST) => {
  const resultList = []
  for (const [ title, ...tryList ] of statusCommandList) {
    let output = ''
    for (const statusCommand of tryList) {
      output = await runStatusCommand(statusCommand, rootPath).catch(() => '')
      if (output) break
    }
    resultList.push([ title, output ])
  }
  return resultList
}

export {
  COMMON_HOST_STATUS_COMMAND_LIST,
  getCommonHostStatus
}
