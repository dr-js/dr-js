import { stringifyEqual } from 'source/common/verify'
import { objectSortKey } from 'source/common/mutable/Object'
import { parseCompactFormat } from './Option'

const { describe, it } = global

describe('Node.Module.Option', () => {
  it('parseCompactFormat()', () => {
    const testParseCompactFormat = (compatFormat, expectFormat) => stringifyEqual(
      objectSortKey(parseCompactFormat(compatFormat)),
      objectSortKey(expectFormat),
      `should match expect, compatFormat: "${compatFormat}"`
    )

    testParseCompactFormat('config', { name: 'config', aliasNameList: [] })
    testParseCompactFormat('config|', { name: 'config', aliasNameList: [] })
    testParseCompactFormat('config||', { name: 'config', aliasNameList: [] })
    testParseCompactFormat('config|||', { name: 'config', aliasNameList: [] })
    testParseCompactFormat('config||||', { name: 'config', aliasNameList: [], description: '|' })
    testParseCompactFormat('config|||a|b\nc', { name: 'config', aliasNameList: [], description: 'a|b\nc' })

    testParseCompactFormat('config,a,b,c', { name: 'config', aliasNameList: [ 'a', 'b', 'c' ], shortName: 'a' })
    testParseCompactFormat('config,aa,b,c', { name: 'config', aliasNameList: [ 'aa', 'b', 'c' ] })

    testParseCompactFormat('config|', { name: 'config', aliasNameList: [] })
    testParseCompactFormat('config|0', { name: 'config', aliasNameList: [], argumentCount: '0' })
    testParseCompactFormat('config|0|', { name: 'config', aliasNameList: [], argumentCount: '0' })
    testParseCompactFormat('config|1-', { name: 'config', aliasNameList: [], argumentCount: '1-' })
    testParseCompactFormat('config|1-|', { name: 'config', aliasNameList: [], argumentCount: '1-' })

    testParseCompactFormat('config||B', { name: 'config', aliasNameList: [], argumentCount: '0-', description: 'set to enable', optional: true })
    testParseCompactFormat('config||O', { name: 'config', aliasNameList: [], optional: true })
    testParseCompactFormat('config||P', { name: 'config', aliasNameList: [], isPath: true })

    testParseCompactFormat('config,c,conf,cfg|1-|OP|load config from some ENV|JSON|JS', {
      name: 'config',
      shortName: 'c',
      aliasNameList: [ 'c', 'conf', 'cfg' ],
      argumentCount: '1-',
      description: 'load config from some ENV|JSON|JS',
      optional: true,
      isPath: true
    })
    testParseCompactFormat('config,c,conf,cfg|1-|BOP|load config from some ENV|JSON|JS', {
      name: 'config',
      shortName: 'c',
      aliasNameList: [ 'c', 'conf', 'cfg' ],
      argumentCount: '1-',
      description: 'load config from some ENV|JSON|JS',
      optional: true,
      isPath: true
    })
  })
})
