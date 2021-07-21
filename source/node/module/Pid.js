import { dirname } from 'path'
import { unlinkSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { catchSync } from 'source/common/error.js'

import { addExitListenerSync } from 'source/node/system/ExitListener.js'
import { isPidExist } from 'source/node/system/Process.js'

const configurePid = ({
  filePid, // if not set, will skip create pid file
  shouldIgnoreExistPid = false // set to overwrite existing pid file
} = {}) => {
  if (!filePid) return

  __DEV__ && !shouldIgnoreExistPid && console.log('check existing pid file', filePid)
  !shouldIgnoreExistPid && catchSync(() => {
    const existingPid = Number(String(readFileSync(filePid)).trim())
    if (!existingPid || !isPidExist(existingPid)) return // allow skip invalid/malformed or un-exist pid

    // NOTE: this will actually exit the process
    console.warn(`[Pid] get existing pid: ${existingPid}, exit process...`)
    process.exit(-1)
  })

  __DEV__ && console.log('create pid file', filePid)
  mkdirSync(dirname(filePid), { recursive: true })
  writeFileSync(filePid, `${process.pid}`)

  addExitListenerSync((exitState) => {
    __DEV__ && console.log('delete pid file', filePid, exitState)
    catchSync(unlinkSync, filePid)
  })
}

export { configurePid }
