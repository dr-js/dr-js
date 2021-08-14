import { includes, strictEqual, truthy } from 'source/common/verify.js'
import { createOptionParser } from './parser.js'

const { describe, it } = globalThis

describe('Node.Module.Option.Parser', () => {
  const optionData = {
    prefixENV: 'prefix-ENV',
    prefixCONFIG: 'prefix-CONFIG',
    formatList: [
      { name: 'option-name-a', shortName: 'a', argumentCount: 0 },
      { name: 'option-name-b', shortName: 'b', argumentCount: 1, argumentListNormalize: (argumentList) => argumentList.map(Number), optional: true },
      { name: 'option-name-c', shortName: 'c', aliasNameList: [ 'onc0', 'onc1' ], argumentCount: 2, argumentListNormalize: (argumentList) => argumentList.map(Number) },
      { name: 'option-name-aa', shortName: 'A', optional: true, argumentCount: '0-', description: 'TEST DESCRIPTION A' },
      { name: 'option-name-bb', shortName: 'B', optional: true, argumentCount: '1-', argumentListNormalize: (argumentList) => argumentList.map(String), description: 'TEST DESCRIPTION B\nTEST DESCRIPTION B\nTEST DESCRIPTION B' },
      { name: 'option-name-cc', shortName: 'C', optional: true, argumentCount: '2-', argumentListNormalize: (argumentList) => argumentList.map(Number), description: 'TEST DESCRIPTION C\n' }
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
    it('should pass formatUsage()', () => truthy(formatUsage().length > 0))
    it('should pass formatUsage(message)', () => includes(formatUsage(message), message))
    it('should pass formatUsage(error)', () => includes(formatUsage(new Error(message)), message))
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
    it('should pass use name', () => truthy(optionNameList.every((name) => (name in optionMap0))))
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
    it('should pass use shortName', () => truthy(optionNameList.every((name) => (name in optionMap1))))
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
    it('should pass use combined shortName', () => truthy(optionNameList.every((name) => (name in optionMap2))))
    it('should pass processOptionMap use combined shortName', () => processOptionMap(optionMap2))
    it('should pass checkArgumentList use combined shortName', () => checkArgumentList(optionMap2))
  })

  describe('parseENV', () => {
    const optionMap = parseENV({
      PREFIX_ENV_OPTION_NAME_A: '[]',
      PREFIX_ENV_OPTION_NAME_B: '[ "1" ]',
      PREFIX_ENV_ONC0: '[ 1, "2.2" ]',
      PREFIX_ENV_OPTION_NAME_AA: '[]',
      PREFIX_ENV_OPTION_NAME_BB: '"1"',
      PREFIX_ENV_OPTION_NAME_CC: '[ 1, "2.2", 3.3, "4.4" ]'
    })
    it('should pass use nameENV', () => truthy(optionNameList.every((name) => (name in optionMap))))
    it('should pass processOptionMap use nameENV', () => processOptionMap(optionMap))
    it('should pass checkArgumentList use nameENV', () => checkArgumentList(optionMap))
  })

  describe('parseCONFIG', () => {
    const optionMap = parseCONFIG({
      prefixCONFIGOptionNameA: [],
      prefixCONFIGOptionNameB: [ 1 ],
      prefixCONFIGOnc1: [ 1, '2.2' ],
      prefixCONFIGOptionNameAa: [],
      prefixCONFIGOptionNameBb: [ 1 ],
      prefixCONFIGOptionNameCc: [ 1, '2.2', 3.3, '4.4' ]
    })
    it('should pass use nameCONFIG', () => truthy(optionNameList.every((name) => (name in optionMap))))
    it('should pass processOptionMap use nameCONFIG', () => processOptionMap(optionMap))
    it('should pass checkArgumentList use nameCONFIG', () => checkArgumentList(optionMap))
  })

  describe('optional&extendFormatList', () => {
    const optionData1 = {
      prefixENV: 'prefix-ENV',
      prefixCONFIG: 'prefix-CONFIG',
      formatList: [
        { name: 'option-name-check-target', argumentCount: 1, optional: true },
        { name: 'option-with-check-optional', optional: (optionMap, optionFormatSet, format) => optionMap[ 'option-name-check-target' ].argumentList[ 0 ] !== 1 },
        {
          name: 'option-with-extend',
          optional: true,
          extendFormatList: [
            { name: 'extend-option-name-a', argumentCount: 0 },
            { name: 'extend-option-name-b', argumentCount: 1, optional: true },
            { name: 'extend-option-name-c', argumentCount: 2 }
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
    it('should pass formatUsage()', () => truthy(formatUsage().length > 0))
    it('should pass formatUsage(message)', () => includes(formatUsage(message), message))
    it('should pass formatUsage(error)', () => includes(formatUsage(new Error(message)), message))

    it('should pass processOptionMap use nameCONFIG', () => processOptionMap(optionMap))
  })
})
