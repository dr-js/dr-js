import { catchAsync } from 'source/common/error.js'
import { run, runStdout, runSync, runStdoutSync } from 'source/node/run.js'
import { probeSync, createArgListPack } from '../function.js'

// $ docker version --format "{{.Server.Version}}"
// Got permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock: Get http://%2Fvar%2Frun%2Fdocker.sock/v1.24/version: dial unix /var/run/docker.sock: connect: permission denied
// $ sudo docker version --format '{{.Server.Version}}'
// 20.10.2

// test sudo prefix: docker version

// $ docker version
// Client: Docker Engine - Community
//  Version:           20.10.2
//  ...
// Server: Docker Engine - Community
//  Engine:
//   Version:          20.10.2
//   ...
// # GitHub Ubuntu:
// Server:
//  Engine:
//   Version:          19.03.13+azure
//   API version:      1.40 (minimum version 1.12)
// # GitHub Windows:
// Server: Mirantis Container Runtime
//  Engine:
//   Version:          19.03.13
//   API version:      1.40 (minimum version 1.24)
// # GitHub Macos: NO docker installed

const { getArgs, setArgs, check, verify } = createArgListPack(
  () => probeSync([ 'docker', 'version' ], 'Server:') ? [ 'docker' ]
    : probeSync([ 'sudo', 'docker', 'version' ], 'Server:') ? [ 'sudo', 'docker' ]
      : undefined,
  'expect "docker" in PATH, with server up'
)
const runDocker = (argList = [], option) => run([ ...verify(), ...argList ], option)
const runDockerStdout = (argList = [], option) => runStdout([ ...verify(), ...argList ], option)
const runDockerSync = (argList = [], option) => runSync([ ...verify(), ...argList ], option)
const runDockerStdoutSync = (argList = [], option) => runStdoutSync([ ...verify(), ...argList ], option)

const checkLocalImage = async (imageRepo, imageTag) => {
  const stdoutString = String(await runDockerStdout([ 'image', 'ls', `${imageRepo}:${imageTag}` ]))
  return stdoutString.includes(imageRepo) && stdoutString.includes(imageTag)
}
const pullImage = async (imageRepo, imageTag) => runDockerStdout([ 'pull', `${imageRepo}:${imageTag}` ])

const checkPullImage = async (imageRepo, imageTag) => {
  if (await checkLocalImage(imageRepo, imageTag)) return true
  await catchAsync(pullImage, imageRepo, imageTag) // try pull remote
  return checkLocalImage(imageRepo, imageTag) // check local again
}

const getContainerLsList = async (isListAll = false) => String(await runDockerStdout([ 'container', 'ls',
  '--format', '{{.ID}}|{{.Image}}|{{.Names}}',
  isListAll && '--all'
].filter(Boolean))).trim().split('\n').filter(Boolean).map((string) => {
  const [ id, image, names ] = string.split('|')
  return { id, image, names }
})

const patchContainerLsListStartedAt = async (
  containerLsList = [] // will mutate and added `startedAt: Date` to containerLsList
) => {
  const idList = containerLsList.map(({ id }) => id)
  String(await runDockerStdout([ 'container', 'inspect',
    '--format', '{{.Id}}|{{.State.StartedAt}}', // https://unix.stackexchange.com/questions/492279/convert-docker-container-dates-to-milliseconds-since-epoch/492291#492291
    ...idList
  ])).trim().split('\n').filter(Boolean).forEach((string) => {
    const [ id, startedAtString ] = string.split('|') // the full id & ISO time string
    const item = containerLsList[ idList.findIndex((v) => id.startsWith(v)) ]
    if (item) item.startedAt = new Date(startedAtString)
  })
}

const matchContainerLsList = (
  containerLsList = [], // will mutate and added `pid: Number` to containerLsList
  processList = [] // from `await getProcessListAsync()`
) => {
  containerLsList.forEach((item) => {
    item.pid = (processList.find(({ command }) => command.includes(item.id)) || {}).pid // NOTE: this pid is host pid, not the pid in container
  })
}

const { getArgs: getArgsCompose, setArgs: setArgsCompose, check: checkCompose, verify: verifyCompose } = createArgListPack(
  () => {
    if (!check()) return undefined // expect docker command available
    const argsList = [ ...getArgs().slice(0, -1), 'docker-compose' ]
    if (probeSync([ ...argsList, 'version' ], 'docker-compose')) return argsList
  },
  'expect both "docker-compose" and "docker" in PATH, with server up'
)
const runCompose = (argList = [], option) => run([ ...verifyCompose(), ...argList ], option)
const runComposeStdout = (argList = [], option) => runStdout([ ...verifyCompose(), ...argList ], option)
const runComposeSync = (argList = [], option) => runSync([ ...verifyCompose(), ...argList ], option)
const runComposeStdoutSync = (argList = [], option) => runStdoutSync([ ...verifyCompose(), ...argList ], option)

export {
  getArgs, setArgs, check, verify,
  runDocker, runDockerStdout, runDockerSync, runDockerStdoutSync,

  checkLocalImage, pullImage, checkPullImage,
  getContainerLsList, patchContainerLsListStartedAt, matchContainerLsList,

  getArgsCompose, setArgsCompose, checkCompose, verifyCompose,
  runCompose, runComposeStdout, runComposeSync, runComposeStdoutSync
}
