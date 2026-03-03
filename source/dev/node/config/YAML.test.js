import { resolve } from 'node:path'
import { strictEqual, stringifyEqual } from 'source/common/verify.js'
import { readText } from 'source/node/fs/File.js'
import { deleteDirectory, resetDirectory } from 'source/node/fs/Directory.js'

import {
  GET_YAML, USE_YAML,
  // parseYAML, stringifyYAML,
  readYAML, readYAMLSync, writeYAML, writeYAMLSync
} from './YAML.js'

const { describe, it, before, after } = global

const TEST_ROOT = resolve(__dirname, 'test-yaml-gitignore')
const fromRoot = (...args) => resolve(TEST_ROOT, ...args)

const YAML_ORG = GET_YAML()
before(async () => resetDirectory(TEST_ROOT))
after(async () => {
  await deleteDirectory(TEST_ROOT)
  USE_YAML(YAML_ORG)
})

const TEST_OBJECT = { a: 1, b: 2, c: { d: 42 } }
const TEST_YAML = `
a: 1
b: 2
c:
  d: 42
`

const itWithBothYAML = (name, testFunc) => {
  it(`${name} with yaml`, () => {
    USE_YAML(require('yaml'))
    return testFunc()
  })
  it(`${name} with yaml-legacy`, () => {
    USE_YAML(require('yaml-legacy'))
    return testFunc()
  })
}

describe('Node.Config.YAML', () => {
  itWithBothYAML('readYAML/writeYAML()', async () => {
    await writeYAML(fromRoot('test.yaml'), TEST_OBJECT)
    strictEqual(
      (await readText(fromRoot('test.yaml'))).trim(),
      TEST_YAML.trim()
    )

    const value = await readYAML(fromRoot('test.yaml'))
    stringifyEqual(value, TEST_OBJECT)
  })

  itWithBothYAML('readYAMLSync/writeYAMLSync()', async () => {
    await writeYAMLSync(fromRoot('test.yaml'), TEST_OBJECT)
    strictEqual(
      (await readText(fromRoot('test.yaml'))).trim(),
      TEST_YAML.trim()
    )

    const value = await readYAMLSync(fromRoot('test.yaml'))
    stringifyEqual(value, TEST_OBJECT)
  })
})
