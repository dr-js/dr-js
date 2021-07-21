import { Preset } from 'source/node/module/Option/preset.js'

const { parseCompact } = Preset

const ExplorerFormatConfig = parseCompact('explorer/T')
const getExplorerOption = ({ getToggle }) => ({
  explorer: getToggle('explorer')
})

export { ExplorerFormatConfig, getExplorerOption }
