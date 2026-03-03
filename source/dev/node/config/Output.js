import { resolve, dirname } from 'node:path'
import { binary } from 'source/common/format.js'
import { isString } from 'source/common/check.js'
import { writeBuffer } from 'source/node/fs/File.js'
import { createDirectory } from 'source/node/fs/Directory.js'

import { stringifyYAML } from './YAML.js'
import { stringifyNginxConf } from 'source/dev/common/config/Nginx.js'

const __RAW = Symbol('CFG:RAW') // mark raw config
const getRawText = (config) => config.__RAW === __RAW && isString(config.text) ? config.text : undefined
const toRawText = (text) => ({ __RAW, text })
const getRawBuffer = (config) => config.__RAW === __RAW && Buffer.isBuffer(config.buffer) ? config.buffer : undefined
const toRawBuffer = (buffer) => ({ __RAW, buffer })

const outputConfig = async (
  pathCombo = '', // 'file-path.json|file-path.yml|file-path.yaml'
  config = {},
  { fromRoot, onOutput }
) => {
  for (const path of pathCombo.split('|')) {
    const buffer = getRawText(config) !== undefined ? Buffer.from(getRawText(config))
      : getRawBuffer(config) !== undefined ? getRawBuffer(config)
        : (path.endsWith('.yml') || path.endsWith('.yaml')) ? Buffer.from(stringifyYAML(config))
          : path.endsWith('.json') ? Buffer.from(JSON.stringify(config, null, 2))
            : path.endsWith('.nginx.conf') ? Buffer.from(stringifyNginxConf(config))
              : null
    if (!buffer) throw new Error(`invalid output path: ${path}`)
    await createDirectory(dirname(fromRoot(path)))
    await writeBuffer(fromRoot(path), buffer)
    onOutput && onOutput(path, buffer)
  }
}

const outputConfigMap = async (
  configMap = {},
  {
    outputRoot = process.cwd(),
    fromRoot = (...args) => resolve(outputRoot, ...args),
    log = () => {},
    onOutput = (path, buffer) => log(`- ${path} (${binary(buffer.length)}B)`)
  } = {}
) => {
  const option = { fromRoot, onOutput }
  for (const [ pathCombo, config ] of Object.entries(configMap)) {
    log(`[${pathCombo}]`)
    await outputConfig(pathCombo, config, option)
  }
}

export {
  getRawText, toRawText,
  getRawBuffer, toRawBuffer,
  outputConfig,
  outputConfigMap
}
