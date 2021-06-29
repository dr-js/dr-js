import { configureTerminalColor } from './TerminalColor.js'

const { describe, it, info = console.log } = globalThis

describe('Node.Module.TerminalColor', () => {
  it('configureTerminalColor()', async () => {
    const TerminalColor = configureTerminalColor()
    info(`TerminalColor.fg.red('test color'): ${TerminalColor.fg.red('test color')}`)
    info(`TerminalColor.bg.darkGray('test color'): ${TerminalColor.bg.darkGray('test color')}`)
  })
})
