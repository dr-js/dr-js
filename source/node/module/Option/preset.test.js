import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { strictEqual, stringifyEqual } from 'source/common/verify'
import { objectSortKey } from 'source/common/mutable/Object'
import { createDirectory } from 'source/node/file/Directory'
import { modifyDelete } from 'source/node/file/Modify'
import { createOptionParser } from './parser'
import {
  Preset,
  parseOptionMap,
  createOptionGetter
} from './preset'

const { describe, it, before, after } = global

const TEST_ROOT = resolve(__dirname, './test-preset-gitignore/')

before('prepare', () => createDirectory(TEST_ROOT))
after('clear', () => modifyDelete(TEST_ROOT))

// __DEV__ && console.log('Preset key list:', Object.keys(Preset))
// __DEV__ && console.log(Preset)
// console.log(Preset.AllPath)

describe('Node.Module.Option.preset', () => {
  describe('Preset', () => {
    const optionData = {
      prefixENV: 'prefix-ENV',
      prefixCONFIG: 'prefix-CONFIG',
      formatList: [
        { name: 'option-name-a', shortName: 'a', argumentCount: 0 },
        { name: 'option-name-b', shortName: 'b', optional: true, ...Preset.SingleInteger },
        { name: 'option-name-c', shortName: 'c', aliasNameList: [ 'onc0', 'onc1' ], ...Preset.AllNumber, argumentCount: 2 },
        { name: 'option-name-aa', shortName: 'A', optional: true, argumentCount: '0-', description: 'TEST DESCRIPTION A' },
        { name: 'option-name-bb', shortName: 'B', optional: true, ...Preset.AllString, argumentCount: '1-', description: 'TEST DESCRIPTION B\nTEST DESCRIPTION B\nTEST DESCRIPTION B' },
        { name: 'option-name-cc', shortName: 'C', optional: true, ...Preset.AllNumber, argumentCount: '2-', description: 'TEST DESCRIPTION C\n' }
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
          { name: 'option-name-check-target', optional: true, ...Preset.SingleInteger },
          { name: 'option-with-check-optional', optional: (optionMap, optionFormatSet, format) => optionMap[ 'option-name-check-target' ].argumentList[ 0 ] !== 1 },
          {
            name: 'option-with-extend',
            optional: true,
            extendFormatList: [
              { name: 'extend-option-name-a', argumentCount: 0 },
              { name: 'extend-option-name-b', optional: true, ...Preset.SingleInteger },
              { name: 'extend-option-name-c', ...Preset.AllNumber, argumentCount: 2 }
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

    describe('createOptionGetter().pwd', () => {
      const optionData2 = {
        formatList: [
          Preset.Config,
          { name: 'option-toggle', ...Preset.Toggle },
          { name: 'option-string', optional: true, ...Preset.SingleString },
          { name: 'option-path', optional: true, ...Preset.SinglePath }
        ]
      }
      const { parseCLI, parseENV, parseCONFIG, processOptionMap } = createOptionParser(optionData2)

      it('test CLI', async () => {
        const { getFirst, pwd } = createOptionGetter(await parseOptionMap({
          parseCLI, parseENV, parseCONFIG, processOptionMap,
          optionCLI: [
            '--option-toggle',
            '--option-string', 'ABC',
            '--option-path', 'A/B/C/file'
          ],
          optionENV: {}
        }))
        strictEqual(getFirst('option-toggle'), true)
        strictEqual(getFirst('option-string'), 'ABC')
        strictEqual(getFirst('option-path'), resolve('A/B/C/file'))
        strictEqual(pwd('non-option'), '')
        strictEqual(pwd('option-toggle'), '')
        strictEqual(pwd('option-string'), '')
        strictEqual(pwd('option-path'), resolve('A/B/C/'))
      })
      it('test ENV', async () => {
        const { getFirst, pwd } = createOptionGetter(await parseOptionMap({
          parseCLI, parseENV, parseCONFIG, processOptionMap,
          optionCLI: [ '--config', 'env' ],
          optionENV: {
            OPTION_TOGGLE: '[]',
            OPTION_STRING: '[ "ABC" ]',
            OPTION_PATH: '[ "A/B/C/file" ]'
          }
        }))
        strictEqual(getFirst('option-toggle'), true)
        strictEqual(getFirst('option-string'), 'ABC')
        strictEqual(getFirst('option-path'), resolve('A/B/C/file'))
        strictEqual(pwd('non-option'), '')
        strictEqual(pwd('option-toggle'), '')
        strictEqual(pwd('option-string'), '')
        strictEqual(pwd('option-path'), resolve('A/B/C/'))
      })
      it('test CONFIG', async () => {
        const pathConfig = resolve(TEST_ROOT, 'test-config.json')
        writeFileSync(pathConfig, JSON.stringify({
          optionToggle: true,
          optionString: 'not ABC',
          optionPath: 'A/B/C/file'
        }))
        const { getFirst, pwd } = createOptionGetter(await parseOptionMap({
          parseCLI, parseENV, parseCONFIG, processOptionMap,
          optionCLI: [
            '--config', pathConfig,
            '--option-string', 'ABC' // should overwrite config
          ],
          optionENV: {}
        }))
        strictEqual(getFirst('option-toggle'), true)
        strictEqual(getFirst('option-string'), 'ABC')
        strictEqual(getFirst('option-path'), resolve(dirname(pathConfig), 'A/B/C/file'))
        strictEqual(pwd('non-option'), '')
        strictEqual(pwd('option-toggle'), dirname(pathConfig))
        strictEqual(pwd('option-string'), '')
        strictEqual(pwd('option-path'), resolve(dirname(pathConfig), 'A/B/C/'))
      })
    })
  })

  it('Preset.parseCompact()', () => {
    const testParseCompact = (compatFormat, expectFormat) => stringifyEqual(
      objectSortKey(Preset.parseCompact(compatFormat)),
      objectSortKey(expectFormat),
      `should match expect, compatFormat: "${compatFormat}"`
    )

    testParseCompact('config', { name: 'config' })
    testParseCompact('config|', { name: 'config' })
    testParseCompact('config/|', { name: 'config' })
    testParseCompact('config//|', { name: 'config' })
    testParseCompact('config///|', { name: 'config' })
    testParseCompact('config////|', { name: 'config' })
    testParseCompact('config||', { name: 'config', description: '|' })
    testParseCompact('config//||', { name: 'config', description: '|' })
    testParseCompact('config////|a|b\nc', { name: 'config', description: 'a|b\nc' })

    testParseCompact('config,a,b,c', { name: 'config', aliasNameList: [ 'a', 'b', 'c' ], shortName: 'a' })
    testParseCompact('config,aa,b,c', { name: 'config', aliasNameList: [ 'aa', 'b', 'c' ], shortName: 'b' })

    testParseCompact('config/SingleString', { name: 'config', argumentCount: 1 })
    testParseCompact('config/SS', { name: 'config', argumentCount: 1 })
    testParseCompact('config/SN', { name: 'config', argumentCount: 1 })
    testParseCompact('config/SI', { name: 'config', argumentCount: 1 })
    testParseCompact('config/SF', { name: 'config', argumentCount: 1 })
    testParseCompact('config/SP', { name: 'config', argumentCount: 1, isPath: true })

    testParseCompact('config/AS', { name: 'config', argumentCount: '1-' })
    testParseCompact('config/AN', { name: 'config', argumentCount: '1-' })
    testParseCompact('config/AI', { name: 'config', argumentCount: '1-' })
    testParseCompact('config/AF', { name: 'config', argumentCount: '1-' })
    testParseCompact('config/AP', { name: 'config', argumentCount: '1-', isPath: true })

    testParseCompact('config/T', { name: 'config', argumentCount: '0-', description: 'set to enable', optional: true })
    testParseCompact('config/O', { name: 'config', optional: true })
    testParseCompact('config/P', { name: 'config', isPath: true })
    testParseCompact('config/O,P', { name: 'config', optional: true, isPath: true })
    testParseCompact('config/P,O', { name: 'config', optional: true, isPath: true })

    testParseCompact('config//0', { name: 'config', argumentCount: '0' })
    testParseCompact('config//0|', { name: 'config', argumentCount: '0' })
    testParseCompact('config//1-', { name: 'config', argumentCount: '1-' })
    testParseCompact('config//1-|', { name: 'config', argumentCount: '1-' })

    testParseCompact('config/Path,Optional', { name: 'config', optional: true, isPath: true })
    testParseCompact('config/P,O', { name: 'config', optional: true, isPath: true })
    testParseCompact('config P,O', { name: 'config', optional: true, isPath: true })
    testParseCompact('config   /  P,O', { name: 'config', optional: true, isPath: true })
    testParseCompact('config      P,O', { name: 'config', optional: true, isPath: true })

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
    testParseCompact('config,c,conf,cfg/O,P/1-|load config from some ENV|JSON|JS', EXPECT_FORMAT)
    testParseCompact('config,c,conf,cfg/T,O,P/1-|load config from some ENV|JSON|JS', EXPECT_FORMAT)
    testParseCompact('config,c,conf,cfg/T,P/1-|load config from some ENV|JSON|JS', EXPECT_FORMAT)

    // compact use space
    testParseCompact('config,c,conf,cfg O,P 1-|load config from some ENV|JSON|JS', EXPECT_FORMAT)
    testParseCompact('config,c,conf,cfg T,O,P 1-|load config from some ENV|JSON|JS', EXPECT_FORMAT)
    testParseCompact('config,c,conf,cfg T,P 1-|load config from some ENV|JSON|JS', EXPECT_FORMAT)

    // compact use tab
    testParseCompact('config,c,conf,cfg\tO,P\t1-|load config from some ENV|JSON|JS', EXPECT_FORMAT)
    testParseCompact('config,c,conf,cfg\tT,O,P\t1-|load config from some ENV|JSON|JS', EXPECT_FORMAT)
    testParseCompact('config,c,conf,cfg\tT,P\t1-|load config from some ENV|JSON|JS', EXPECT_FORMAT)

    // compact use tab-space
    testParseCompact('config,c,conf,cfg     O,P       1-  |load config from some ENV|JSON|JS', EXPECT_FORMAT)
    testParseCompact('config,c,conf,cfg     T,O,P     1-  |load config from some ENV|JSON|JS', EXPECT_FORMAT)
    testParseCompact('config,c,conf,cfg     T,P       1-  |load config from some ENV|JSON|JS', EXPECT_FORMAT)

    // compact use sep&space
    testParseCompact('config,c,conf,cfg  /  O,P    /  1-  |load config from some ENV|JSON|JS', EXPECT_FORMAT)
    testParseCompact('config,c,conf,cfg  /  T,O,P  /  1-  |load config from some ENV|JSON|JS', EXPECT_FORMAT)
    testParseCompact('config,c,conf,cfg  /  T,P    /  1-  |load config from some ENV|JSON|JS', EXPECT_FORMAT)

    // compact use madness
    testParseCompact(`config,c,conf,cfg
      O,P
      1-
      |load config from some ENV|JSON|JS`, EXPECT_FORMAT)
    testParseCompact(`config,c,conf,cfg
      T,O,P
      1-
      |load config from some ENV|JSON|JS`, EXPECT_FORMAT)
    testParseCompact(`config,c,conf,cfg
      T,P
      1-
      |load config from some ENV|JSON|JS`, EXPECT_FORMAT)
  })
})
