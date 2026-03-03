import { isString, isBasicObject } from 'source/common/check.js'
import { objectFromEntries } from 'source/common/immutable/Object.js'

import { runPassThrough } from 'source/dev/node/run.js'

const doExec = async (argList, {
  env,
  cwd = process.cwd()
}) => runPassThrough(argList, {
  env: { ...process.env, ...parseEnvStringOrObject(env) },
  cwd
})

const parseEnvStringOrObject = (envStringOrObject) => {
  if (!envStringOrObject) return
  if (isString(envStringOrObject)) return objectFromEntries(new URLSearchParams(envStringOrObject))
  if (isBasicObject(envStringOrObject)) return envStringOrObject
  throw new Error(`unexpected env: ${envStringOrObject}`)
}

export {
  doExec
}
