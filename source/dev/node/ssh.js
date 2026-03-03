import { tryRequire } from 'source/env/tryRequire.js'
import { time } from 'source/common/format.js'
import { indentLine, autoEllipsis } from 'source/common/string.js'
import { createStepper } from 'source/common/time.js'
import { createInsideOutPromise } from 'source/common/function.js'

import { expandHome } from 'source/node/fs/Path.js'
import { readBufferSync } from 'source/node/fs/File.js'
import { joinCommand } from 'source/node/module/Software/bash.js'

import { color } from './color.js'

const GET_SSH2 = (log = console.warn) => {
  const SSH2 = tryRequire('@min-pack/ssh2') || tryRequire('ssh2')
  if (SSH2) return SSH2
  const error = new Error('[SSH2] failed to load package "ssh2"')
  log(error)
  throw error
}

const getConnectOption = ({
  SSH2 = GET_SSH2(),
  host = '127.0.0.1',
  port = 22,
  username = 'root',
  privateKeyPath = '~/.ssh/id_rsa',
  privateKeyBuffer = privateKeyPath && readBufferSync(expandHome(privateKeyPath)),
  privateKeyPassphrase, // optional
  readyTimeout = 16 * 1000, // in msec, 16sec
  isAutoSetAgent = true, // also try use ssh-agent (usually for OSX)
  ...extraOption // check: https://github.com/mscdex/ssh2#client-methods
}) => {
  if (isAutoSetAgent && process.env.SSH_AUTH_SOCK) extraOption = { agent: process.env.SSH_AUTH_SOCK, agentForward: true, ...extraOption }
  return {
    SSH2,
    host, port, username,
    privateKey: privateKeyBuffer, passphrase: privateKeyPassphrase,
    readyTimeout,
    ...extraOption
  }
}

// the client wrapper is much simpler, expect use with linear async (no `Promise.all([ exec(), exec() ])` usage)
const startSSHClient = async (connectOption) => { // should though `getConnectOption()`
  const connection = new connectOption.SSH2.Client()

  const connect = async (connectOption) => {
    const IOP = createInsideOutPromise()
    connection.on('error', IOP.reject)
    connection.on('ready', IOP.resolve)
    try { connection.connect(connectOption) } catch (error) {
      // TODO: HACK:
      //   ssh2 may throw error on `privateKey` processing, before trying to connect (mostly `Encrypted private key detected, but no passphrase given`)
      //   so we drop privateKey and retry with `agent` only, check: https://github.com/mscdex/ssh2/blob/master/lib/client.js#L236
      if (connectOption.agent && connectOption.privateKey) connection.connect({ ...connectOption, privateKey: undefined }) // try connect with agent only
      else IOP.reject(error)
    }
    await IOP.promise
    connection.off('error', IOP.reject)
    connection.off('ready', IOP.resolve)
  }

  const end = async () => {
    _sftp = undefined
    const IOP = createInsideOutPromise()
    connection.on('error', IOP.reject)
    connection.on('close', IOP.resolve)
    connection.end()
    await IOP.promise
    connection.off('error', IOP.reject)
    connection.off('close', IOP.resolve)
  }

  const exec = async ({
    command,
    onOutputBuffer, // = (type, buffer) => {},
    ...extraSSHClientExecOption // check: https://github.com/mscdex/ssh2#client-methods
  }) => new Promise((resolve, reject) => connection.exec(command, extraSSHClientExecOption, (error, channelStream) => {
    if (error) return reject(error)
    channelStream.on('close', (code, signal) => resolve({ code, signal }))
    onOutputBuffer && channelStream.on('data', (buffer) => onOutputBuffer('stdout', buffer))
    onOutputBuffer && channelStream.stderr.on('data', (buffer) => onOutputBuffer('stderr', buffer))
  }))

  let _sftp
  const sftpConn = async () => { if (_sftp === undefined) _sftp = await new Promise((resolve, reject) => connection.sftp((error, sftp) => error ? reject(error) : resolve(sftp))) }
  const sftpUpload = async ({ localPath, remotePath }) => { // https://www.npmjs.com/package/ssh2#get-a-directory-listing-via-sftp & https://github.com/mscdex/ssh2-streams/blob/master/SFTPStream.md
    await sftpConn()
    return new Promise((resolve, reject) => _sftp.fastPut(localPath, remotePath, (error) => error ? reject(error) : resolve()))
    // sftp.disconnect() // no method, so just wait SSH end
  }
  const sftpDownload = async ({ localPath, remotePath }) => {
    await sftpConn()
    return new Promise((resolve, reject) => _sftp.fastGet(remotePath, localPath, (error) => error ? reject(error) : resolve()))
    // sftp.disconnect() // no method, so just wait SSH end
  }

  await connect(connectOption)
  __DEV__ && connection.on('error', (error) => console.log('## error ##\n  error:', error))
  __DEV__ && connection.on('end', () => console.log('## end ##'))
  __DEV__ && connection.on('close', (hadError) => console.log(`## close ##\n  hadError: ${hadError}`))
  __DEV__ && connection.on('ready', () => console.log('## ready ##'))
  __DEV__ && connection.on('continue', () => console.log('## continue ##'))

  return { end, exec, sftpUpload, sftpDownload }
}

const startDryRunSSHClient = async (log = console.warn) => {
  log('DRY-RUN|SSH', 'skip connect')
  return {
    end: async () => { log('DRY-RUN|SSH', 'skip end') },
    exec: async ({ command }) => {
      log('DRY-RUN|SSH', `skip exec ${JSON.stringify(autoEllipsis(command))}`)
      return { code: 0, signal: null }
    },
    sftpUpload: async ({ localPath, remotePath }) => { log('DRY-RUN|SSH', `skip upload to "${remotePath}"`) },
    sftpDownload: async ({ localPath, remotePath }) => { log('DRY-RUN|SSH', `skip download from "${remotePath}"`) }
  }
}

// TODO: add timeout? // must use `pty: true` + `channelStream.write('\x03')`
// { // check: https://github.com/mscdex/ssh2/issues/165 // EDIT: OpenSSH does not implement the method of signal passing (stream.signal()) defined in the relevant SSH RFCs.
//   const execPromise = clientStore.exec({ command: 'dr-js --stc', pty: true })
//   console.log('pre exec', clientStore.getState())
//
//   await setTimeoutAsync(2000)
//   console.log('pre exec + 2000', clientStore.getState())
//   // clientStore.getState().exec.channelStream.signal('TERM')
//   clientStore.getState().exec.channelStream.write('\x03')
//
//   console.log('exec result', await execPromise)
//   console.log('post exec', clientStore.getState())
// }

const quickSSH = async (
  connectOptionRaw,
  commandList = [
    // commandString like 'ls -al ./'
    // will join with `joinShell` and run in single exec
  ],
  {
    preConnect = ({ connectOption, command, commandList }) => LOG_EXEC('CONNECT', `${connectOption.username}@${connectOption.host}:${connectOption.port}`),
    preUpload = ({ connectOption, localPath, remotePath }) => LOG_EXEC('UPLOAD', `FROM "${localPath}"`, `TO   "${remotePath}"`), // log upload
    uploadList = [], // [ [ localPath, remotePath ] ] // NOTE: cannot auto mkdir, so make sure upper path exists
    preExec = ({ connectOption, command, commandList }) => LOG_EXEC('EXEC', command), // log command
    postExec = ({ connectOption, command, commandList, duration, code, signal }) => LOG_EXEC('', `done, code: ${code}, signal: ${signal} (${time(duration)})`), // log exit code
    preDownload = ({ connectOption, localPath, remotePath }) => LOG_EXEC('DOWNLOAD', `TO   "${localPath}"`, `FROM "${remotePath}"`), // log upload
    downloadList = [], // [ [ localPath, remotePath ] ] // NOTE: cannot auto mkdir, so make sure upper path exists
    onOutputBuffer = DEFAULT_ON_OUTPUT_BUFFER,
    isIgnoreExecCode = false, // default stop on non-zero code
    isDryRun = false // for testing process
  } = {}
) => {
  const connectOption = getConnectOption(connectOptionRaw)
  const command = joinCommand(commandList)
  preConnect && await preConnect({ connectOption, command, commandList })
  const { end, exec, sftpUpload, sftpDownload } = await (isDryRun ? startDryRunSSHClient(LOG_ERROR) : startSSHClient(connectOption))
  try {
    for (const [ localPath, remotePath ] of uploadList) {
      preUpload && await preUpload({ connectOption, localPath, remotePath })
      await sftpUpload({ localPath, remotePath })
    }
  } catch (error) {
    await end() // close connection
    throw error // re-throw
  }
  preExec && await preExec({ connectOption, command, commandList })
  const stepper = createStepper()
  const { code, signal } = await exec({ command, onOutputBuffer })
  preExec && await postExec({ connectOption, command, commandList, duration: stepper(), code, signal })
  try {
    for (const [ localPath, remotePath ] of downloadList) {
      preDownload && await preDownload({ connectOption, localPath, remotePath })
      await sftpDownload({ localPath, remotePath })
    }
  } catch (error) {
    await end() // close connection
    throw error // re-throw
  }
  await end()
  if (!isIgnoreExecCode && code !== 0) throw new Error(`task end with code: ${code}, signal: ${signal}, command:\n${indentLine(command, '  ')}`)
  return { code, signal }
}

const createColorLog = (colorTitle, colorText) => (title, ...args) => console.log([
  title && colorTitle(`[${title}]`),
  ...args.map((v) => colorText(indentLine(v, '    ')))
].filter(Boolean).join('\n'))

const LOG_EXEC = createColorLog(color.lightYellow, color.yellow)
const LOG_ERROR = createColorLog(color.lightRed, color.red)
const LOG_CONFIG = createColorLog(color.lightGreen, color.green)
const DEFAULT_ON_OUTPUT_BUFFER = (type, buffer) => {
  const outputString = String(buffer).trimEnd() // drop extra '\n'
  if (outputString.length === 0) return
  type === 'stderr'
    ? console.error(color.red(indentLine(outputString, ' E> ')))
    : console.log(color.darkGray(indentLine(outputString, ' O> ')))
}

export {
  GET_SSH2, getConnectOption,
  startSSHClient, startDryRunSSHClient,

  quickSSH,
  createColorLog, LOG_EXEC, LOG_ERROR, LOG_CONFIG
}
