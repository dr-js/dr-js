import { resolve } from 'node:path'
import { userInfo } from 'node:os'
import { chmodSync } from 'node:fs'
import { doThrowAsync } from 'source/common/verify.js'
import { setTimeoutAsync } from 'source/common/time.js'
import { deleteDirectory, resetDirectory } from 'source/node/fs/Directory.js'
import { commonCommandList, toHeredocNoMagic, catStringToFileCommand } from 'source/node/module/Software/bash.js'
import { check as checkDocker, runDockerSync } from 'source/node/module/Software/docker.js'
import { resolveCommandName } from 'source/node/system/ResolveCommand.js'
import { run, runSync } from 'source/node/run.js'

import { quickSSH } from './ssh.js'
import { modifyRename } from 'source/node/fs/Modify.js'
import { writeText } from 'source/node/fs/File.js'

const { describe, it, before, after, info = console.log } = global

const TEST_FOLDER_NAME = 'test-ssh-gitignore'
const TEST_ROOT = resolve(__dirname, TEST_FOLDER_NAME)
const fromRoot = (...args) => resolve(TEST_ROOT, ...args)

const RUN_BG = {}

const HAS_DOCKER = checkDocker()
const HAS_SSH_KEYGEN = resolveCommandName('ssh-keygen')
const HAS_SSHD = resolveCommandName('sshd')
const HAS_SSH = resolveCommandName('ssh')
const CAN_TEST = (__DEV__ || process.platform === 'linux') && HAS_SSH_KEYGEN && (HAS_DOCKER || HAS_SSHD) // NOTE: only test on linux for now, win32 ci do not run linux docker, darwin ci will sshd error

const TEST_SSHD_PORT = 54345
const SSHD_CONF_STRING = `
Port ${TEST_SSHD_PORT} # abnormal port for test
AuthorizedKeysFile /tmp/dr-dev-ssh-test/user-home/.ssh/authorized_keys # locked path for test
StrictModes no # bypass dir permission checking # NOTE: danger in production server
# PubkeyAcceptedKeyTypes +ssh-rsa # NOTE: OpenSSH@8 auth issue: https://github.com/mscdex/ssh2/issues/989

PermitRootLogin prohibit-password
PubkeyAuthentication yes
PasswordAuthentication no

AcceptEnv LANG LC_* # Allow client to pass locale environment variables
Subsystem sftp /usr/lib/openssh/sftp-server # override default of no subsystems
`
const SSHD_COMMAND = `
mkdir -p /run/sshd/ # for sshd to use
rm -rf /tmp/dr-dev-ssh-test/
cp -r -T ./${TEST_FOLDER_NAME}/ /tmp/dr-dev-ssh-test/
mkdir -p /tmp/dr-dev-ssh-test/user-home/.ssh/
cat /tmp/dr-dev-ssh-test/test-key-gitignore.pub >> /tmp/dr-dev-ssh-test/user-home/.ssh/authorized_keys
cat /tmp/dr-dev-ssh-test/test-key-password-gitignore.pub >> /tmp/dr-dev-ssh-test/user-home/.ssh/authorized_keys
chmod 600 /tmp/dr-dev-ssh-test/user-home/.ssh/authorized_keys /tmp/dr-dev-ssh-test/*.pri
chmod 700 /tmp/dr-dev-ssh-test/user-home/.ssh/
chmod go-w /tmp/dr-dev-ssh-test/user-home/
/usr/sbin/sshd -D -e -h /tmp/dr-dev-ssh-test/test-host-key-gitignore.pri -f /tmp/dr-dev-ssh-test/sshd-gitignore.conf
`
const DOCKER_IMAGE = 'ghcr.io/dr-js/debian:12-bin-git-0.3.4'

const generateSSHKey = async (name, passphrase = '') => {
  runSync([ 'ssh-keygen',
    '-t', 'rsa',
    '-b', '4096',
    '-N', passphrase, // '' for no passphrase
    '-f', fromRoot(`${name}.pri`),
    '-C', name
  ])
  await modifyRename(fromRoot(`${name}.pri.pub`), fromRoot(`${name}.pub`))
}

CAN_TEST && before(async () => {
  await resetDirectory(fromRoot())

  info('generate ssh key')
  await generateSSHKey('test-host-key-gitignore')
  await generateSSHKey('test-key-gitignore')
  await generateSSHKey('test-key-password-gitignore', 'word-pass')

  info('generate ssh config')
  await writeText(fromRoot('sshd-gitignore.conf'), SSHD_CONF_STRING)

  info('start sshd...')
  if (HAS_DOCKER) {
    info('docker setup')
    runDockerSync([ 'container', 'run', '--detach', '--rm',
      '--name=dev-kit-openssh-server',
      `--publish=127.0.0.1:${TEST_SSHD_PORT}:${TEST_SSHD_PORT}`,
      `--volume=${fromRoot()}:/mnt/${TEST_FOLDER_NAME}/`,
      '--workdir=/mnt/',
      DOCKER_IMAGE, 'bash', '-ec', SSHD_COMMAND
    ])
  } else { // not recommended run on host, may pollute fs & more risky
    info('direct sshd setup')
    const { subProcess, promise } = run([ 'bash', '-ec', SSHD_COMMAND ], { quiet: true, cwd: __dirname })
    RUN_BG.subProcess = subProcess
    RUN_BG.promise = promise
  }
  await setTimeoutAsync(2000) // should be enough for most computer
})
CAN_TEST && after(async () => {
  info('stop sshd...')
  if (HAS_DOCKER) {
    info('docker setup')
    runDockerSync([ 'container', 'stop', '--time=1', 'dev-kit-openssh-server' ])
  } else {
    info('direct sshd setup', RUN_BG.subProcess.pid)
    process.kill(RUN_BG.subProcess.pid)
    await RUN_BG.promise
  }

  info('clear ssh key & config')
  await deleteDirectory(fromRoot())
})

const addTestWithConnectOption = (connectOption, tag = 'test') => {
  !connectOption.privateKeyPassphrase && HAS_SSH && it('native ssh test connection', async () => {
    chmodSync(connectOption.privateKeyPath, 0o600)
    await run([
      'ssh', `ssh://${connectOption.username}@${connectOption.host}:${connectOption.port}`,
      '-i', connectOption.privateKeyPath,
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'UserKnownHostsFile=/dev/null',
      'bash', '-ec', 'ls -al'
    ]).promise
  })

  it('quickSSH isDryRun', async () => quickSSH(connectOption, commonCommandList([
    'ls -al',
    'ps aux',
    'env',
    'pwd',
    'false || true',
    'echo $PWD',
    'cat << EOM', // test shell multi-line A
    '  AAA',
    '  AAA',
    'EOM',
    'echo "', // test shell multi-line B
    '  BBB',
    '  BBB',
    '"'
  ]), {
    uploadList: [
      [ __filename, `/tmp/${tag}-upload-0` ],
      [ __filename, `/tmp/${tag}-upload-1` ]
    ],
    downloadList: [
      [ fromRoot(`__tmp_${tag}-upload-0`), `/tmp/${tag}-upload-0` ],
      [ fromRoot(`__tmp_${tag}-upload-1`), `/tmp/${tag}-upload-1` ]
    ],
    isDryRun: true
  }))

  it('quickSSH', async () => quickSSH(connectOption, commonCommandList([
    'ls -al',
    'ps aux',
    'env',
    'pwd',
    'false || true',
    'echo $PWD',
    'cat << EOM', // test shell multi-line A
    '  AAA',
    '  AAA',
    'EOM',
    'echo "', // test shell multi-line B
    '  BBB',
    '  BBB',
    '"'
  ])))

  it('quickSSH connect error', async () => doThrowAsync(async () => quickSSH({
    ...connectOption,
    port: 2
  }, commonCommandList([
    'false'
  ]))))

  it('quickSSH exec error', async () => doThrowAsync(async () => quickSSH(connectOption, commonCommandList([
    'false'
  ]))))

  it('quickSSH uploadList', async () => quickSSH(connectOption, commonCommandList([
    'ls -al /tmp/'
  ]), {
    uploadList: [
      [ __filename, `/tmp/${tag}-upload-0` ],
      [ __filename, `/tmp/${tag}-upload-1` ]
    ]
  }))

  it('quickSSH downloadList', async () => quickSSH(connectOption, commonCommandList([
  ]), {
    downloadList: [
      [ fromRoot(`__tmp_${tag}-upload-0`), `/tmp/${tag}-upload-0` ],
      [ fromRoot(`__tmp_${tag}-upload-1`), `/tmp/${tag}-upload-1` ]
    ]
  }))

  it('quickSSH uploadList no-auto-mkdir', async () => doThrowAsync(async () => quickSSH(connectOption, commonCommandList([
    'ls -al /tmp/'
  ]), {
    uploadList: [ [ __filename, `/tmp/${tag}-folder-not-exist/upload-0` ] ]
  })))

  it('quickSSH downloadList no-auto-mkdir', async () => doThrowAsync(async () => quickSSH(connectOption, commonCommandList([
  ]), {
    downloadList: [ [ fromRoot(`__tmp_${tag}-folder-not-exist/upload-0`), `/tmp/${tag}-folder-not-exist/upload-0` ] ]
  })))

  it('quickSSH toHeredocNoMagic()', async () => quickSSH(connectOption, commonCommandList([
    `cat ${toHeredocNoMagic(JSON.stringify(process.versions, null, 2))}`,
    `cat ${toHeredocNoMagic(JSON.stringify(process.versions, null, 2), '', 'EEEOOOMMM')}`,
    `cat ${toHeredocNoMagic(JSON.stringify(process.versions), `>> ./${tag}-file`)}`,
    `cat ${toHeredocNoMagic(JSON.stringify(process.versions), `> ./${tag}-file`, 'EEEOOOMMM')}`,
    `cat ./${tag}-file`
  ])))

  it('quickSSH catStringToFileCommand()', async () => quickSSH(connectOption, commonCommandList([
    catStringToFileCommand(`(${() => {
      let index = 0
      console.log(index++, process.version)
      console.log(index++, process.platform)
      console.log(index++, process.arch)
      console.log(index++, process.argv)
    }})()`, `./test file name with space ${tag}`),
    `cat "test file name with space ${tag}"`,
    `node "test file name with space ${tag}"`
  ])))
}

CAN_TEST && describe('ssh', () => {
  const connectOption = {
    host: '127.0.0.1',
    port: TEST_SSHD_PORT,
    username: (!HAS_DOCKER && HAS_SSHD) ? userInfo().username : 'root',
    privateKeyPath: fromRoot('test-key-gitignore.pri')
  }

  const connectOptionPassphrase = {
    ...connectOption,
    privateKeyPath: fromRoot('test-key-password-gitignore.pri'),
    privateKeyPassphrase: 'word-pass'
  }

  addTestWithConnectOption({ ...connectOption, SSH2: require('@min-pack/ssh2') }, 'test-mpssh2')
  addTestWithConnectOption({ ...connectOption, SSH2: require('ssh2') }, 'test-ssh2')

  addTestWithConnectOption({ ...connectOptionPassphrase, SSH2: require('@min-pack/ssh2') }, 'test-mpssh2-passphrase')
  addTestWithConnectOption({ ...connectOptionPassphrase, SSH2: require('ssh2') }, 'test-ssh2-passphrase')
})
