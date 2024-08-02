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
  'expect "docker" in PATH, with dockerd up'
)
const runDocker = (argList = [], option) => run([ ...verify(), ...argList ], option)
const runDockerSync = (argList = [], option) => runSync([ ...verify(), ...argList ], option)
const runDockerStdout = (argList = [], option) => runStdout([ ...verify(), ...argList ], option)
const runDockerStdoutSync = (argList = [], option) => runStdoutSync([ ...verify(), ...argList ], option)

// pick `[ 'ghcr.io/dr-js/debian', '11-node-0.3.5-dev.0' ]` from `ghcr.io/dr-js/debian:11-node-0.3.5-dev.0`
const parseDockerImage = (image = '') => {
  if (image.toLowerCase().includes('@sha256:')) throw new Error(`expect tag without digest: ${image}`) // https://docs.docker.com/engine/reference/commandline/pull/#pull-an-image-by-digest-immutable-identifier
  const stubList = image.split(':')
  if (stubList.length <= 1) throw new Error(`expect explicit tag: ${image}`)
  const tag = stubList.pop()
  if (!/^\w[\w-.]+$/.test(tag)) throw new Error(`invalid tag: ${image}`) // https://docs.docker.com/engine/reference/commandline/tag/#description // The tag must be valid ASCII and can contain lowercase and uppercase letters, digits, underscores, periods, and hyphens. It cannot start with a period or hyphen and must be no longer than 128 characters.
  return [ stubList.join(':'), tag ] // [ imageRepo, imageTag ]
}

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

// $ docker compose version
// Docker Compose version v2.28.1
// $ docker-compose version
// Docker Compose version v2.2.1
// $ docker-compose version
// docker-compose version 1.29.2, build 5becea4c
// ...
const { getArgs: getArgsCompose, setArgs: setArgsCompose, check: checkCompose, verify: verifyCompose } = createArgListPack(
  () => {
    if (!check()) return undefined // expect docker command available
    const argsListP = [ ...getArgs(), 'compose' ] // as plugin
    if (probeSync([ ...argsListP, 'version' ], 'ompose version')) return argsListP
    const argsList = [ ...getArgs().slice(0, -1), 'docker-compose' ]
    if (probeSync([ ...argsList, 'version' ], 'ompose version')) return argsList
  },
  'expect both "docker" and "docker compose|docker-compose" in PATH, with dockerd up'
)
const runCompose = (argList = [], option) => run([ ...verifyCompose(), ...argList ], option)
const runComposeSync = (argList = [], option) => runSync([ ...verifyCompose(), ...argList ], option)
const runComposeStdout = (argList = [], option) => runStdout([ ...verifyCompose(), ...argList ], option)
const runComposeStdoutSync = (argList = [], option) => runStdoutSync([ ...verifyCompose(), ...argList ], option)

export {
  getArgs, setArgs, check, verify,
  runDocker, runDockerSync,
  runDockerStdout, runDockerStdoutSync,

  parseDockerImage,
  checkLocalImage, pullImage, checkPullImage,
  getContainerLsList, patchContainerLsListStartedAt, matchContainerLsList,

  getArgsCompose, setArgsCompose, checkCompose, verifyCompose,
  runCompose, runComposeSync,
  runComposeStdout, runComposeStdoutSync
}
