import { strictEqual } from 'source/common/verify.js'
import { createColor } from 'source/node/module/TerminalTTY.js'

import {
  color
} from './color.js'

const { describe, it } = globalThis

describe('Node.Color', () => {
  it('match TerminalColor:fg', () => {
    strictEqual(
      Object.keys(color).sort().join('|'),
      Object.keys(createColor().fg).sort().join('|')
    )
  })
})
