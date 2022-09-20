import { encode as encodeB62S } from 'source/common/data/B62S.js'
import { getRandomId62S } from 'source/common/math/random.js'
import { run, runStdout, runSync, runStdoutSync } from 'source/node/run.js'
import { probeSync, createArgListPack } from '../function.js'

// NOTE: darwin will ship `bash@3.2`
// NOTE: win32 no default bash, may get `git-bash` or `wsl-bash`, both need special full path

// $ bash --version
// GNU bash, version 5.0.3(1)-release (x86_64-pc-linux-gnu)
// Copyright (C) 2019 Free Software Foundation, Inc.
// License GPLv3+: GNU GPL ...

const { getArgs, setArgs, check, verify } = createArgListPack(
  () => probeSync([ 'bash', '--version' ], 'GNU bash')
    ? [ 'bash' ]
    : undefined,
  'expect "bash" in PATH'
)
const runBash = (argList = [], option) => run([ ...verify(), ...argList ], option)
const runBashSync = (argList = [], option) => runSync([ ...verify(), ...argList ], option)
const runBashStdout = (argList = [], option) => runStdout([ ...verify(), ...argList ], option)
const runBashStdoutSync = (argList = [], option) => runStdoutSync([ ...verify(), ...argList ], option)
const runBashCommand = (commandList = [], option) => runStdout([ ...verify(), '-ec', joinCommand(commonCommandList(commandList)) ], option)
const runBashCommandSync = (commandList = [], option) => runSync([ ...verify(), '-ec', joinCommand(commonCommandList(commandList)) ], option)

// TODO: NOTE: no quoting check below, so avoid complex scripts & quote when needed
// NOTE: mostly used for building ssh or docker bash commands
//  argList = exec command for run/runSync
//  command = string, single or combined bash command
//  commandList = list of string, each string should be a single bash command

const commonBashArgList = (commandList) => [
  'bash', '-ec', // "-e" for exit on error
  joinCommand(commandList)
]

const joinCommand = (commandList) => commandList
  .filter(Boolean)
  .join('\n')

const commonCommandList = (commandList) => [
  'shopt -s dotglob nullglob',
  'set -ex',
  ...commandList
]

const subShellCommandList = (commandList) => [ // with padding for better log grouping
  '( # '.padEnd(16, '='),
  ...commandList,
  ') # '.padEnd(16, '=')
]

// NOTE: will append a extra "\n", use for script or text config: https://stackoverflow.com/questions/37728699/here-string-adds-line-break
const toHeredocNoMagic = ( // return half command, no magic meaning no shell expanding and more (with the quoted EOM)
  string = '',
  extraPipeCommand = '',
  EOM = getRandomId62S(`EOM-${encodeB62S(string.length)}-`) // better with this long random EOM
) => `<< '${EOM}' ${extraPipeCommand}
${string}
${EOM}`
const catStringToFileCommand = (
  string,
  pathFile // NOTE: `pathFile` should be absolute path, or the path will be relative to cwd
) => `cat ${toHeredocNoMagic(string, `> "${pathFile}"`)}`

const gitFetchBranchCommandList = (
  branchName,
  branchCommitHash = 'HEAD',
  remoteName = 'origin'
) => [
  `git fetch --force --no-tags "${remoteName}" "${branchName}:remotes/${remoteName}/${branchName}"`,
  `git checkout --force -B "${branchName}"`,
  `git reset --hard "${branchCommitHash}"`
]
const gitCleanUpCommandList = () => [
  'git gc --auto',
  '( git branch -D $(git branch | grep -v \\* | xargs) 2> /dev/null || true )' // delete non-current local branch
]

const commonSourceProfileCommandList = () => [
  '[[ -f /etc/profile ]] && source /etc/profile',
  '[[ -f ~/.profile ]] && source ~/.profile',
  '[[ -f ~/.bash_profile ]] && source ~/.bash_profile'
]

export {
  getArgs, setArgs, check, verify,
  runBash, runBashSync,
  runBashStdout, runBashStdoutSync,
  runBashCommand, runBashCommandSync,

  commonBashArgList,
  joinCommand,
  commonCommandList,
  subShellCommandList,

  toHeredocNoMagic, catStringToFileCommand,
  gitFetchBranchCommandList, gitCleanUpCommandList,
  commonSourceProfileCommandList
}
