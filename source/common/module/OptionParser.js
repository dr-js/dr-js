import { stringIndentLine, stringListJoinCamelCase } from 'source/common/format'

// const sampleOptionFormatData = {
//   prefixENV: 'prefix-ENV',
//   prefixJSON: 'prefix-JSON',
//   formatList: [
//     {
//       name: 'option-name',                                     // name, separate words with '-'
//       shortName: 'n',                                          // optional, default '', single char [A-Za-z] name alias
//       optional: false,                                         // optional, default false
//       argumentCount: 0,                                        // optional, default 0, can be 0, 1, 2, ... or '0+', '1+' for more than
//       argumentListNormalize: (argumentList) => argumentList,   // optional, default (argumentList) => argumentList, can map each value in argumentList
//       argumentListVerify: (argumentList)=> {},                 // optional, default (argumentList)=> {}, can add custom logic to throw error
//       description: ''                                          // optional, default '', description, can be multiline
//       /* auto append */
//       // nameENV: 'PREFIX_ENV_OPTION_NAME'
//       // nameJSON: 'prefixJSONOptionName'
//       // argumentLength: 0
//       // argumentLengthExtend: false
//     }
//   ]
// }

// const sampleOptionList = [
//   { format: { ... }, argumentList: [] },
//   { format: { ... }, argumentList: [] },
//   { format: { ... }, argumentList: [] }
// ]

const REGEXP_FORMAT_NAME = /[A-Za-z][A-Za-z0-9-]+/
const REGEXP_FORMAT_SHORT_NAME = /[A-Za-z]/
const REGEXP_FORMAT_ARGUMENT_COUNT = /(\d+)(\+)?/
const REGEXP_FORMAT_CLI_NAME = /^--([A-Za-z][A-Za-z0-9-]+)(=(.*))?$/ // NOTE: may match one extra argument
const REGEXP_FORMAT_CLI_SHORT_NAME = /^-([A-Za-z]+)(=(.*))?$/ // NOTE: will match merged short command, may match one extra argument

const NORMALIZE_DEFAULT = (argumentList) => argumentList
const VERIFY_DEFAULT = (argumentList) => {}

const FORMAT_DEFAULT = {
  name: '',
  nameENV: '',
  nameJSON: '',
  shortName: '',
  optional: false,
  argumentCount: 0,
  argumentLength: 0,
  argumentLengthExtend: false,
  argumentListNormalize: NORMALIZE_DEFAULT,
  argumentListVerify: VERIFY_DEFAULT,
  description: ''
}

const createOptionParser = ({ formatList, prefixENV = '', prefixJSON = '' }) => {
  formatList = formatList.map((format, index) => {
    format = { ...FORMAT_DEFAULT, ...format }
    if (!REGEXP_FORMAT_NAME.test(format.name)) throw new Error(`[createOptionParser] error format name '${format.name}' at #${index}, ${JSON.stringify(format)}`)
    if (format.shortName && !REGEXP_FORMAT_SHORT_NAME.test(format.shortName)) throw new Error(`[createOptionParser] error format shortName '${format.shortName}' at #${index}, ${JSON.stringify(format)}`)
    if (!REGEXP_FORMAT_ARGUMENT_COUNT.test(format.argumentCount)) throw new Error(`[createOptionParser] error format argumentCount '${format.argumentCount}' at #${index}, ${JSON.stringify(format)}`)
    return format
  })

  const CLINameMap = new Map()
  const CLIShortNameMap = new Map()
  const ENVNameMap = new Map()
  const JSONNameMap = new Map()
  const optionalFormatSet = new Set()
  const nonOptionalFormatSet = new Set()
  formatList.forEach((format, index) => {
    const { name, shortName, optional, argumentCount } = format
    const [ , argumentLengthString, argumentLengthExtendMark ] = REGEXP_FORMAT_ARGUMENT_COUNT.exec(argumentCount.toString())
    format.nameENV = (prefixENV ? `${prefixENV}-${name}` : name).split('-').join('_').toUpperCase()
    format.nameJSON = stringListJoinCamelCase((prefixJSON ? `${prefixJSON}-${name}` : name).split('-'))
    format.argumentLength = parseInt(argumentLengthString)
    format.argumentLengthExtend = argumentLengthExtendMark === '+'

    if (CLINameMap.has(name)) throw new Error(`[createOptionParser] duplicate name '${name}' at #${index}, ${JSON.stringify(format)}. already has ${JSON.stringify(CLINameMap.get(name))}`)
    CLINameMap.set(name, format)
    if (shortName && CLIShortNameMap.has(shortName)) throw new Error(`[createOptionParser] duplicate shortName '${shortName}' at #${index}, ${JSON.stringify(format)}. already has ${JSON.stringify(CLIShortNameMap.get(shortName))}`)
    shortName && CLIShortNameMap.set(shortName, format)
    ENVNameMap.set(format.nameENV, format)
    JSONNameMap.set(format.nameJSON, format)
    optional ? optionalFormatSet.add(format) : nonOptionalFormatSet.add(format)
  })

  const parseCLI = (argvList) => {
    argvList = argvList.slice(2) // drop [node] [script]
    const optionList = []
    for (let index = 0, indexMax = argvList.length; index < indexMax; index++) {
      const value = argvList[ index ]
      if (REGEXP_FORMAT_CLI_NAME.test(value)) { // check name
        const [ , name, , extraArgument ] = REGEXP_FORMAT_CLI_NAME.exec(value)
        const format = CLINameMap.get(name)
        if (!format) throw new Error(`[parseCLI] unexpected option '${name}'`)
        optionList.push({ format, argumentList: [] })
        extraArgument && optionList[ optionList.length - 1 ].argumentList.push(extraArgument)
      } else if (REGEXP_FORMAT_CLI_SHORT_NAME.test(value)) { // shortName
        const [ , shortNameString, , extraArgument ] = REGEXP_FORMAT_CLI_SHORT_NAME.exec(value)
        shortNameString.split('').forEach((shortName) => {
          const format = CLIShortNameMap.get(shortName)
          if (!format) throw new Error(`[parseCLI] unexpected option '${shortName}' in '${shortNameString}'`)
          optionList.push({ format, argumentList: [] })
        })
        extraArgument && optionList[ optionList.length - 1 ].argumentList.push(extraArgument)
      } else if (value === '--') { // mark remaining argvList as current option argument
        if (optionList.length === 0) throw new Error(`[parseCLI] unexpected '--', no leading option found`)
        optionList[ optionList.length - 1 ].argumentList.push(...argvList.slice(index))
        break
      } else { // argument
        if (optionList.length === 0) throw new Error(`[parseCLI] unexpected argument '${value}', no leading option found`)
        optionList[ optionList.length - 1 ].argumentList.push(value)
      }
    }
    return optionList.reduce((optionMap, { format, argumentList }) => {
      optionMap[ format.name ] = { format, argumentList }
      return optionMap
    }, {})
  }

  const parseENV = (envObject) => {
    const optionMap = {}
    ENVNameMap.forEach((format, nameENV) => {
      let value = envObject[ nameENV ]
      if (!value) return
      try {
        value = JSON.parse(value)
      } catch (error) { __DEV__ && console.log(`[parseENV] not JSON string ${value}\n${error}`) }
      optionMap[ format.name ] = { format, argumentList: Array.isArray(value) ? value : [ value ] }
    })
    return optionMap
  }

  const parseJSON = (jsonObject) => {
    const optionMap = {}
    JSONNameMap.forEach((format, nameJSON) => {
      const value = jsonObject[ nameJSON ]
      if (!value) return
      optionMap[ format.name ] = { format, argumentList: Array.isArray(value) ? value : [ value ] }
    })
    return optionMap
  }

  const processOptionMap = (optionMap) => processOptionMapWithFormatSet(optionMap, optionalFormatSet, nonOptionalFormatSet)

  const formatUsage = (message) => (
    (message ? `Message:\n${stringIndentLine(message.toString(), '  ')}\n` : '') +
    `CLI Usage:\n${stringIndentLine(formatUsageCLI(formatList), '  ')}\n` +
    `ENV Usage:\n${stringIndentLine(formatUsageENV(formatList), '  ')}\n` +
    `JSON Usage:\n${stringIndentLine(formatUsageJSON(formatList), '  ')}\n`
  )

  return {
    parseCLI,
    parseENV,
    parseJSON,
    processOptionMap,
    formatUsage
  }
}

const processOptionMapWithFormatSet = (optionMap, optionalFormatSet, nonOptionalFormatSet) => {
  const optionFormatSet = new Set()
  Object.keys(optionMap).forEach((name) => {
    let { format, argumentList } = optionMap[ name ]
    if (format.argumentLength > argumentList.length) throw new Error(`[processOptionList] expected ${format.argumentLength - argumentList.length} more argument ${JSON.stringify(argumentList)} for option: ${JSON.stringify(format)}`)
    if (!format.argumentLengthExtend && format.argumentLength < argumentList.length) throw new Error(`[processOptionList] expected ${argumentList.length - format.argumentLength} less argument ${JSON.stringify(argumentList)} for option: ${JSON.stringify(format)}`)
    __DEV__ && optionFormatSet.has(format) && console.log(`[processOptionList] get duplicate option: ${JSON.stringify(format)}`)
    optionMap[ name ].argumentList = argumentList = format.argumentListNormalize(argumentList)
    format.argumentListVerify(argumentList)
    optionFormatSet.add(format)
  })
  nonOptionalFormatSet.forEach((format) => {
    if (!optionFormatSet.has(format)) throw new Error(`[processOptionList] missing required option: ${JSON.stringify(format)}`)
  })
  return optionMap
}

const formatUsageBase = (text, optional, argumentLength, argumentLengthExtend) => (
  text +
  (optional ? ` [OPTIONAL]` : '') +
  (argumentLength || argumentLengthExtend ? ` [ARGUMENT=${argumentLength}${argumentLengthExtend ? '+' : ''}]` : '')
)
const formatUsageCLI = (formatList) => formatList.map(({ name, shortName, optional, argumentLength, argumentLengthExtend, description }) => (
  formatUsageBase(`--${name}${shortName ? ` -${shortName}` : ''}`, optional, argumentLength, argumentLengthExtend) +
  (description ? `:\n${stringIndentLine(description, '    ')}` : '')
)).join('\n')
const formatUsageENV = (formatList) => `"\n  #!/bin/bash\n${formatList.map(({ name, nameENV, optional, argumentLength, argumentLengthExtend }) => `  export ${nameENV}="${formatUsageBase(name, optional, argumentLength, argumentLengthExtend)}"`).join('\n')}\n"`
const formatUsageJSON = (formatList) => `{\n${formatList.map(({ name, nameJSON, optional, argumentLength, argumentLengthExtend }) => `  "${nameJSON}": [ "${formatUsageBase(name, optional, argumentLength, argumentLengthExtend)}" ]`).join(',\n')}\n}`

// TODO: can separate to normalize
const normalizeToString = (argumentList) => argumentList.map(String)
const normalizeToNumber = (argumentList) => argumentList.map(Number)
const normalizeToInteger = (argumentList) => argumentList.map(parseInt)

// TODO: can separate to verify
const verifySingleString = (argumentList) => { if (argumentList.length !== 1 || typeof (argumentList[ 0 ]) !== 'string') throw new Error(`[verify] single String expected, get ${argumentList}`) }
const verifySingleNumber = (argumentList) => { if (argumentList.length !== 1 || typeof (argumentList[ 0 ]) !== 'number') throw new Error(`[verify] single Number expected, get ${argumentList}`) }
const verifySingleInteger = (argumentList) => { if (argumentList.length !== 1 || !Number.isInteger(argumentList[ 0 ])) throw new Error(`[verify] single Integer expected, get ${argumentList}`) }
const verifyAllString = (argumentList) => { argumentList.length && argumentList.some((v, index) => { if (typeof (v) !== 'string') throw new Error(`[verify] String expected at #${index}, get ${v} in ${argumentList}`) }) }
const verifyAllNumber = (argumentList) => { argumentList.length && argumentList.some((v, index) => { if (typeof (v) !== 'number') throw new Error(`[verify] Number expected at #${index}, get ${v} in ${argumentList}`) }) }
const verifyAllInteger = (argumentList) => { argumentList.length && argumentList.some((v, index) => { if (!Number.isInteger(v)) throw new Error(`[verify] Integer expected at #${index}, get ${v} in ${argumentList}`) }) }
const verifyOneOf = (selectList) => (argumentList) => { if (argumentList.length !== 1 || !selectList.includes(argumentList[ 0 ])) throw new Error(`[verify] unexpected selection, should be one of ${selectList}, get ${argumentList}`) }

const OPTION_CONFIG_PRESET = {
  SingleString: { argumentCount: 1, argumentListNormalize: normalizeToString, argumentListVerify: verifySingleString },
  SingleNumber: { argumentCount: 1, argumentListNormalize: normalizeToNumber, argumentListVerify: verifySingleNumber },
  SingleInteger: { argumentCount: 1, argumentListNormalize: normalizeToInteger, argumentListVerify: verifySingleInteger },
  AllString: { argumentCount: '1+', argumentListNormalize: normalizeToString, argumentListVerify: verifyAllString },
  AllNumber: { argumentCount: '1+', argumentListNormalize: normalizeToNumber, argumentListVerify: verifyAllNumber },
  AllInteger: { argumentCount: '1+', argumentListNormalize: normalizeToInteger, argumentListVerify: verifyAllInteger },
  OneOfString: (selectList) => ({ argumentCount: 1, argumentListNormalize: normalizeToString, argumentListVerify: verifyOneOf(selectList) }),
  OneOfNumber: (selectList) => ({ argumentCount: 1, argumentListNormalize: normalizeToNumber, argumentListVerify: verifyOneOf(selectList) }),
  OneOfInteger: (selectList) => ({ argumentCount: 1, argumentListNormalize: normalizeToInteger, argumentListVerify: verifyOneOf(selectList) })
}

export {
  createOptionParser,
  OPTION_CONFIG_PRESET
}
