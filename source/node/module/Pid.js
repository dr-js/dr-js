import { dirname } from 'path'
import { catchSync } from 'source/common/error.js'

import { readTextSync, writeTextSync } from 'source/node/fs/File.js'
import { createDirectorySync } from 'source/node/fs/Directory.js'
import { deletePathSync } from 'source/node/fs/Path.js'
import { addExitListenerSync } from 'source/node/system/ExitListener.js'
import { isPidExist } from 'source/node/system/Process.js'

const configurePid = ({
  filePid, // if not set, will skip create pid file
  shouldIgnoreExistPid = false // set to overwrite existing pid file
} = {}) => {
  if (!filePid) return

  __DEV__ && !shouldIgnoreExistPid && console.log('check existing pid file', filePid)
  !shouldIgnoreExistPid && catchSync(() => {
    const existingPid = Number(readTextSync(filePid).trim())
    if (!existingPid || !isPidExist(existingPid)) return // allow skip invalid/malformed or un-exist pid

    // NOTE: this will actually exit the process
    console.warn(`[Pid] get existing pid: ${existingPid}, exit process...`)
    process.exit(-1)
  })

  __DEV__ && console.log('create pid file', filePid)
  createDirectorySync(dirname(filePid))
  writeTextSync(filePid, `${process.pid}`)

  addExitListenerSync((exitState) => {
    __DEV__ && console.log('delete pid file', filePid, exitState)
    catchSync(deletePathSync, filePid)
  })
}

export { configurePid }
