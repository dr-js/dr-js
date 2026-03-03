import { tryRequire } from 'source/env/tryRequire.js'
import { readText, writeText, readTextSync, writeTextSync } from 'source/node/fs/File.js'

const GET_YAML = (log = console.warn) => {
  const YAML = tryRequire('yaml')
  if (YAML) return YAML
  const error = new Error('[YAML] failed to load package "yaml"')
  log(error)
  throw error
}

let CACHED_YAML
const USE_YAML = (YAML) => { CACHED_YAML = YAML }
const __YAML__ = () => {
  if (CACHED_YAML === undefined) CACHED_YAML = GET_YAML()
  return CACHED_YAML
}

const parseYAML = (string) => __YAML__().parse(string)
const stringifyYAML = (value) => __YAML__().stringify(value)

const readYAML = async (path) => parseYAML(await readText(path))
const readYAMLSync = (path) => parseYAML(readTextSync(path))
const writeYAML = async (path, value) => writeText(path, stringifyYAML(value))
const writeYAMLSync = (path, value) => writeTextSync(path, stringifyYAML(value))

export {
  GET_YAML, USE_YAML,
  parseYAML, stringifyYAML,
  readYAML, readYAMLSync, writeYAML, writeYAMLSync
}
