import { spawnSync } from 'child_process'

const spawnString = ([ command, ...argList ]) => String(spawnSync(command, argList).stdout || '')
const probeSync = (argList = [], expect) => spawnString(argList).includes(expect)

const createArgListPack = (
  getArgList, // () => [] || undefined // NOTE: return false to deny later re-check, should not throw
  message
) => {
  let args // undefined, or array like [ '7z' ] and [ 'sudo', 'docker' ]
  const check = () => {
    if (args === undefined) args = getArgList()
    return Boolean(args)
  }
  const verify = () => {
    if (args === undefined) args = getArgList()
    if (!args) throw new Error(message)
    return args // array
  }
  return {
    getArgs: () => args, // may get undefined
    setArgs: (...newArgs) => (args = newArgs), // allow change the preset one
    check,
    verify
  }
}

export {
  spawnString, probeSync,
  createArgListPack
}
