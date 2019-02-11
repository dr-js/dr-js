import { strictEqual, stringifyEqual } from 'source/common/verify'
import { objectSortKey } from 'source/common/mutable/Object'
import { createOptionParser } from './parser'
import { ConfigPreset, parseCompactFormat } from './preset'

const { describe, it } = global

describe('Node.Module.Option.preset', () => {
  describe('ConfigPreset', () => {
    const optionData = {
      prefixENV: 'prefix-ENV',
      prefixCONFIG: 'prefix-CONFIG',
      formatList: [
        { name: 'option-name-a', shortName: 'a', argumentCount: 0 },
        { name: 'option-name-b', shortName: 'b', optional: true, ...ConfigPreset.SingleInteger },
        { name: 'option-name-c', shortName: 'c', aliasNameList: [ 'onc0', 'onc1' ], ...ConfigPreset.AllNumber, argumentCount: 2 },
        { name: 'option-name-aa', shortName: 'A', optional: true, argumentCount: '0-', description: 'TEST DESCRIPTION A' },
        { name: 'option-name-bb', shortName: 'B', optional: true, ...ConfigPreset.AllString, argumentCount: '1-', description: 'TEST DESCRIPTION B\nTEST DESCRIPTION B\nTEST DESCRIPTION B' },
        { name: 'option-name-cc', shortName: 'C', optional: true, ...ConfigPreset.AllNumber, argumentCount: '2-', description: 'TEST DESCRIPTION C\n' }
      ]
    }
    const optionNameList = optionData.formatList.map(({ name }) => name)
    const { parseCLI, parseENV, parseCONFIG, processOptionMap, formatUsage } = createOptionParser(optionData)

    const checkArgumentList = (optionMap) => {
      strictEqual(optionMap[ 'option-name-a' ].argumentList.length, 0)

      strictEqual(optionMap[ 'option-name-b' ].argumentList.length, 1)
      strictEqual(optionMap[ 'option-name-b' ].argumentList[ 0 ], 1)

      strictEqual(optionMap[ 'option-name-c' ].argumentList.length, 2)
      strictEqual(optionMap[ 'option-name-c' ].argumentList[ 0 ], 1)
      strictEqual(optionMap[ 'option-name-c' ].argumentList[ 1 ], 2.2)

      strictEqual(optionMap[ 'option-name-aa' ].argumentList.length, 0)

      strictEqual(optionMap[ 'option-name-bb' ].argumentList.length, 1)
      strictEqual(optionMap[ 'option-name-bb' ].argumentList[ 0 ], '1')

      strictEqual(optionMap[ 'option-name-cc' ].argumentList.length, 4)
      strictEqual(optionMap[ 'option-name-cc' ].argumentList[ 0 ], 1)
      strictEqual(optionMap[ 'option-name-cc' ].argumentList[ 1 ], 2.2)
      strictEqual(optionMap[ 'option-name-cc' ].argumentList[ 2 ], 3.3)
      strictEqual(optionMap[ 'option-name-cc' ].argumentList[ 3 ], 4.4)
    }

    describe('formatUsage', () => {
      const message = 'TEST_MESSAGE'
      it('should pass formatUsage()', () => strictEqual(formatUsage().length > 0, true))
      it('should pass formatUsage(message)', () => strictEqual(formatUsage(message).includes(message), true))
      it('should pass formatUsage(error)', () => strictEqual(formatUsage(new Error(message)).includes(message), true))
    })

    describe('parseCLI', () => {
      const optionMap0 = parseCLI([
        // 'NODE',
        // 'SCRIPT.js',
        '--option-name-a',
        '--option-name-b=1',
        '--option-name-c=1', '2.2',
        '--option-name-cc=1', '2.2', '3.3', '4.4',
        '--option-name-bb', '1',
        '--option-name-aa'
      ])
      it('should pass use name', () => strictEqual(optionNameList.every((name) => (name in optionMap0)), true))
      it('should pass processOptionMap use name', () => processOptionMap(optionMap0))
      it('should pass checkArgumentList use name', () => checkArgumentList(optionMap0))

      const optionMap1 = parseCLI([
        // 'NODE',
        // 'SCRIPT.js',
        '-a',
        '-b=1',
        '-c=1', '2.2',
        '-A',
        '-B', '1',
        '-C=1', '2.2', '3.3', '4.4'
      ])
      it('should pass use shortName', () => strictEqual(optionNameList.every((name) => (name in optionMap1)), true))
      it('should pass processOptionMap use shortName', () => processOptionMap(optionMap1))
      it('should pass checkArgumentList use shortName', () => checkArgumentList(optionMap1))

      const optionMap2 = parseCLI([
        // 'NODE',
        // 'SCRIPT.js',
        '-ab=1',
        '-AB', '1',
        '--onc0=1',
        '--onc1=2.2',
        '-C=1', '2.2', '3.3', '4.4'
      ])
      it('should pass use combined shortName', () => strictEqual(optionNameList.every((name) => (name in optionMap2)), true))
      it('should pass processOptionMap use combined shortName', () => processOptionMap(optionMap2))
      it('should pass checkArgumentList use combined shortName', () => checkArgumentList(optionMap2))
    })

    describe('parseENV', () => {
      const optionMap = parseENV({
        PREFIX_ENV_OPTION_NAME_A: '[]',
        PREFIX_ENV_OPTION_NAME_B: '[ "1" ]',
        PREFIX_ENV_OPTION_NAME_C: '[ 1, "2.2" ]',
        PREFIX_ENV_OPTION_NAME_AA: '[]',
        PREFIX_ENV_OPTION_NAME_BB: '"1"',
        PREFIX_ENV_OPTION_NAME_CC: '[ 1, "2.2", 3.3, "4.4" ]'
      })
      it('should pass use nameENV', () => strictEqual(optionNameList.every((name) => (name in optionMap)), true))
      it('should pass processOptionMap use nameENV', () => processOptionMap(optionMap))
      it('should pass checkArgumentList use nameENV', () => checkArgumentList(optionMap))
    })

    describe('parseCONFIG', () => {
      const optionMap = parseCONFIG({
        prefixCONFIGOptionNameA: [],
        prefixCONFIGOptionNameB: [ 1 ],
        prefixCONFIGOptionNameC: [ 1, '2.2' ],
        prefixCONFIGOptionNameAa: [],
        prefixCONFIGOptionNameBb: [ 1 ],
        prefixCONFIGOptionNameCc: [ 1, '2.2', 3.3, '4.4' ]
      })
      it('should pass use nameCONFIG', () => strictEqual(optionNameList.every((name) => (name in optionMap)), true))
      it('should pass processOptionMap use nameCONFIG', () => processOptionMap(optionMap))
      it('should pass checkArgumentList use nameCONFIG', () => checkArgumentList(optionMap))
    })

    describe('optional&extendFormatList', () => {
      const optionData1 = {
        prefixENV: 'prefix-ENV',
        prefixCONFIG: 'prefix-CONFIG',
        formatList: [
          { name: 'option-name-check-target', optional: true, ...ConfigPreset.SingleInteger },
          { name: 'option-with-check-optional', optional: (optionMap, optionFormatSet, format) => optionMap[ 'option-name-check-target' ].argumentList[ 0 ] !== 1 },
          {
            name: 'option-with-extend',
            optional: true,
            extendFormatList: [
              { name: 'extend-option-name-a', argumentCount: 0 },
              { name: 'extend-option-name-b', optional: true, ...ConfigPreset.SingleInteger },
              { name: 'extend-option-name-c', ...ConfigPreset.AllNumber, argumentCount: 2 }
            ]
          }
        ]
      }
      const { parseCONFIG, processOptionMap, formatUsage } = createOptionParser(optionData1)
      const optionMap = parseCONFIG({
        prefixCONFIGOptionNameCheckTarget: [ 1 ],
        prefixCONFIGOptionWithCheckOptional: [],
        prefixCONFIGOptionWithExtend: [],
        prefixCONFIGExtendOptionNameA: [],
        prefixCONFIGExtendOptionNameB: [ 1 ],
        prefixCONFIGExtendOptionNameC: [ 1, '2.2' ]
      })

      const message = 'TEST_MESSAGE'
      it('should pass formatUsage()', () => strictEqual(formatUsage().length > 0, true))
      it('should pass formatUsage(message)', () => strictEqual(formatUsage(message).includes(message), true))
      it('should pass formatUsage(error)', () => strictEqual(formatUsage(new Error(message)).includes(message), true))

      it('should pass processOptionMap use nameCONFIG', () => processOptionMap(optionMap))
    })
  })

  it('parseCompactFormat()', () => {
    const testParseCompactFormat = (compatFormat, expectFormat) => stringifyEqual(
      objectSortKey(parseCompactFormat(compatFormat)),
      objectSortKey(expectFormat),
      `should match expect, compatFormat: "${compatFormat}"`
    )

    testParseCompactFormat('config', { name: 'config', aliasNameList: [] })
    testParseCompactFormat('config|', { name: 'config', aliasNameList: [] })
    testParseCompactFormat('config/|', { name: 'config', aliasNameList: [] })
    testParseCompactFormat('config//|', { name: 'config', aliasNameList: [] })
    testParseCompactFormat('config///|', { name: 'config', aliasNameList: [] })
    testParseCompactFormat('config////|', { name: 'config', aliasNameList: [] })
    testParseCompactFormat('config||', { name: 'config', aliasNameList: [], description: '|' })
    testParseCompactFormat('config//||', { name: 'config', aliasNameList: [], description: '|' })
    testParseCompactFormat('config////|a|b\nc', { name: 'config', aliasNameList: [], description: 'a|b\nc' })

    testParseCompactFormat('config,a,b,c', { name: 'config', aliasNameList: [ 'a', 'b', 'c' ], shortName: 'a' })
    testParseCompactFormat('config,aa,b,c', { name: 'config', aliasNameList: [ 'aa', 'b', 'c' ] })

    testParseCompactFormat('config/SingleString', { name: 'config', aliasNameList: [], argumentCount: 1, description: '', optional: false })
    testParseCompactFormat('config/SS', { name: 'config', aliasNameList: [], argumentCount: 1, description: '', optional: false })
    testParseCompactFormat('config/SN', { name: 'config', aliasNameList: [], argumentCount: 1, description: '', optional: false })
    testParseCompactFormat('config/SI', { name: 'config', aliasNameList: [], argumentCount: 1, description: '', optional: false })
    testParseCompactFormat('config/SF', { name: 'config', aliasNameList: [], argumentCount: 1, description: '', optional: false })
    testParseCompactFormat('config/SP', { name: 'config', aliasNameList: [], argumentCount: 1, description: '', isPath: true, optional: false })

    testParseCompactFormat('config/AS', { name: 'config', aliasNameList: [], argumentCount: '1-', description: '', optional: false })
    testParseCompactFormat('config/AN', { name: 'config', aliasNameList: [], argumentCount: '1-', description: '', optional: false })
    testParseCompactFormat('config/AI', { name: 'config', aliasNameList: [], argumentCount: '1-', description: '', optional: false })
    testParseCompactFormat('config/AF', { name: 'config', aliasNameList: [], argumentCount: '1-', description: '', optional: false })
    testParseCompactFormat('config/AP', { name: 'config', aliasNameList: [], argumentCount: '1-', description: '', isPath: true, optional: false })

    testParseCompactFormat('config/T', { name: 'config', aliasNameList: [], argumentCount: '0-', description: 'set to enable', optional: true })
    testParseCompactFormat('config/O', { name: 'config', aliasNameList: [], optional: true })
    testParseCompactFormat('config/P', { name: 'config', aliasNameList: [], isPath: true })
    testParseCompactFormat('config/O,P', { name: 'config', aliasNameList: [], optional: true, isPath: true })
    testParseCompactFormat('config/P,O', { name: 'config', aliasNameList: [], optional: true, isPath: true })

    testParseCompactFormat('config//0', { name: 'config', aliasNameList: [], argumentCount: '0' })
    testParseCompactFormat('config//0|', { name: 'config', aliasNameList: [], argumentCount: '0' })
    testParseCompactFormat('config//1-', { name: 'config', aliasNameList: [], argumentCount: '1-' })
    testParseCompactFormat('config//1-|', { name: 'config', aliasNameList: [], argumentCount: '1-' })

    testParseCompactFormat('config/Path,Optional', { name: 'config', aliasNameList: [], optional: true, isPath: true })
    testParseCompactFormat('config/P,O', { name: 'config', aliasNameList: [], optional: true, isPath: true })
    testParseCompactFormat('config P,O', { name: 'config', aliasNameList: [], optional: true, isPath: true })
    testParseCompactFormat('config   /  P,O', { name: 'config', aliasNameList: [], optional: true, isPath: true })
    testParseCompactFormat('config      P,O', { name: 'config', aliasNameList: [], optional: true, isPath: true })

    const EXPECT_FORMAT = {
      name: 'config',
      shortName: 'c',
      aliasNameList: [ 'c', 'conf', 'cfg' ],
      argumentCount: '1-',
      description: 'load config from some ENV|JSON|JS',
      optional: true,
      isPath: true
    }

    // compact
    testParseCompactFormat('config,c,conf,cfg/O,P/1-|load config from some ENV|JSON|JS', EXPECT_FORMAT)
    testParseCompactFormat('config,c,conf,cfg/T,O,P/1-|load config from some ENV|JSON|JS', EXPECT_FORMAT)
    testParseCompactFormat('config,c,conf,cfg/T,P/1-|load config from some ENV|JSON|JS', EXPECT_FORMAT)

    // compact use space
    testParseCompactFormat('config,c,conf,cfg O,P 1-|load config from some ENV|JSON|JS', EXPECT_FORMAT)
    testParseCompactFormat('config,c,conf,cfg T,O,P 1-|load config from some ENV|JSON|JS', EXPECT_FORMAT)
    testParseCompactFormat('config,c,conf,cfg T,P 1-|load config from some ENV|JSON|JS', EXPECT_FORMAT)

    // compact use tab
    testParseCompactFormat('config,c,conf,cfg\tO,P\t1-|load config from some ENV|JSON|JS', EXPECT_FORMAT)
    testParseCompactFormat('config,c,conf,cfg\tT,O,P\t1-|load config from some ENV|JSON|JS', EXPECT_FORMAT)
    testParseCompactFormat('config,c,conf,cfg\tT,P\t1-|load config from some ENV|JSON|JS', EXPECT_FORMAT)

    // compact use tab-space
    testParseCompactFormat('config,c,conf,cfg     O,P       1-  |load config from some ENV|JSON|JS', EXPECT_FORMAT)
    testParseCompactFormat('config,c,conf,cfg     T,O,P     1-  |load config from some ENV|JSON|JS', EXPECT_FORMAT)
    testParseCompactFormat('config,c,conf,cfg     T,P       1-  |load config from some ENV|JSON|JS', EXPECT_FORMAT)

    // compact use sep&space
    testParseCompactFormat('config,c,conf,cfg  /  O,P    /  1-  |load config from some ENV|JSON|JS', EXPECT_FORMAT)
    testParseCompactFormat('config,c,conf,cfg  /  T,O,P  /  1-  |load config from some ENV|JSON|JS', EXPECT_FORMAT)
    testParseCompactFormat('config,c,conf,cfg  /  T,P    /  1-  |load config from some ENV|JSON|JS', EXPECT_FORMAT)
  })
})
