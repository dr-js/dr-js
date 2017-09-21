import { stringIndentLine, stringListJoinCamelCase } from 'source/common/format'

// const sampleOptionFormatData = {
//   prefixENV: 'prefix-ENV',
//   prefixJSON: 'prefix-JSON',
//   formatList: [ {
//     name: 'option-name',                                                   // separate words with '-'
//     shortName: 'n',                                                        // optional, default '', single char [A-Za-z] name alias
//     optional: false || (optionMap, optionFormatSet, format) => Boolean,    // optional, default false, can set checkOptional function, checkOptional should return false for non-optional
//     argumentCount: 0,                                                      // optional, default 0, can be 0, 1, 2, ... or '0+', '1+' for more than
//     argumentListNormalize: (argumentList) => argumentList,                 // optional, default (argumentList) => argumentList, can map each value in argumentList
//     argumentListVerify: (argumentList)=> {},                               // optional, default (argumentList)=> {}, can add custom logic to throw error
//     description: ''                                                        // optional, default '', description, can be multiline
//     extendFormatList: []                                                   // optional, default [], will enable additional option when this option is set
//   } ]
// }
// const sampleOutputOptionMap = {
//   [format.name]: { format: { ... }, argumentList: [] }
// }

const REGEXP_FORMAT_NAME = /[A-Za-z][A-Za-z0-9-]+/ // limit name to something like `abc-abc-123`
const REGEXP_FORMAT_SHORT_NAME = /[A-Za-z]/ // single character
const REGEXP_FORMAT_ARGUMENT_COUNT = /(\d+)(\+)?/
const REGEXP_FORMAT_CLI_NAME = /^--([A-Za-z][A-Za-z0-9-]+)(=(.*))?$/ // NOTE: may match one extra argument
const REGEXP_FORMAT_CLI_SHORT_NAME = /^-([A-Za-z]+)(=(.*))?$/ // NOTE: will match merged short command, may match one extra argument
const NORMALIZE_DEFAULT = (argumentList) => argumentList
const VERIFY_DEFAULT = (argumentList) => {}
const FORMAT_DEFAULT = {
  name: '',
  nameENV: '', // auto append
  nameJSON: '', // auto append
  shortName: '',
  optional: false,
  argumentCount: 0,
  argumentLengthMin: 0, // auto append
  argumentLengthMax: 0, // auto append
  argumentListNormalize: NORMALIZE_DEFAULT,
  argumentListVerify: VERIFY_DEFAULT,
  description: '',
  extendFormatList: []
}

const createOptionParser = ({ formatList, prefixENV = '', prefixJSON = '' }) => {
  const CLINameMap = new Map()
  const CLIShortNameMap = new Map()
  const ENVNameMap = new Map()
  const JSONNameMap = new Map()
  const nonOptionalFormatSet = new Set()
  const optionalFormatCheckSet = new Set()
  const parseFormat = (format, index, upperFormat) => {
    const { name, shortName, argumentCount } = format
    const [ , argumentLengthString, argumentLengthExtendMark ] = REGEXP_FORMAT_ARGUMENT_COUNT.exec(argumentCount.toString())
    format.nameENV = (prefixENV ? `${prefixENV}-${name}` : name).split('-').join('_').toUpperCase()
    format.nameJSON = stringListJoinCamelCase((prefixJSON ? `${prefixJSON}-${name}` : name).split('-'))
    if (upperFormat) format.optional = getOptionalCheckUpperFormat(format.optional, upperFormat)
    format.argumentLengthMin = parseInt(argumentLengthString)
    format.argumentLengthMax = argumentLengthExtendMark === '+' ? Infinity : format.argumentLengthMin

    if (CLINameMap.has(name)) throw getFormatError(`duplicate name '${name}'`, format, index, upperFormat)
    CLINameMap.set(name, format)
    if (shortName && CLIShortNameMap.has(shortName)) throw getFormatError(`duplicate shortName '${shortName}'`, format, index, upperFormat)
    shortName && CLIShortNameMap.set(shortName, format)
    ENVNameMap.set(format.nameENV, format)
    JSONNameMap.set(format.nameJSON, format)
    if (!format.optional) nonOptionalFormatSet.add(format)
    else if (typeof (format.optional) === 'function') optionalFormatCheckSet.add({ format, checkOptional: format.optional })

    if (format.extendFormatList.length !== 0) format.extendFormatList = format.extendFormatList.map((extendFormat, index) => parseFormat(extendFormat, index, format))
  }

  formatList = formatList.map((format, index) => normalizeFormat(format, index, null))
  formatList.forEach((format, index) => parseFormat(format, index, null))

  return {
    parseCLI: getParseCLI(CLINameMap, CLIShortNameMap),
    parseENV: getParseENV(ENVNameMap),
    parseJSON: getParseJSON(JSONNameMap),
    processOptionMap: getProcessOptionMap(nonOptionalFormatSet, optionalFormatCheckSet),
    formatUsage: (message) => (message ? `Message:\n${stringIndentLine(message.toString(), '  ')}\n` : '') +
      `CLI Usage:\n${stringIndentLine(formatUsageCLI(formatList), '  ')}\n` +
      `ENV Usage:\n${stringIndentLine(formatUsageENV(formatList), '  ')}\n` +
      `JSON Usage:\n${stringIndentLine(formatUsageJSON(formatList), '  ')}\n`
  }
}

const getFormatError = (message, format, index, upperFormat) => new Error(`[ERROR][Format] <${formatSimple(format)} #${index}${upperFormat ? ` of ${formatSimple(upperFormat)}` : ''}> ${message}`)
const normalizeFormat = (format, index, upperFormat) => {
  format = { ...FORMAT_DEFAULT, ...format }
  if (!REGEXP_FORMAT_NAME.test(format.name)) throw getFormatError(`name '${format.name}'`, format, index, upperFormat)
  if (format.shortName && !REGEXP_FORMAT_SHORT_NAME.test(format.shortName)) throw getFormatError(`shortName '${format.shortName}'`, format, index, upperFormat)
  if (!REGEXP_FORMAT_ARGUMENT_COUNT.test(format.argumentCount)) throw getFormatError(`argumentCount '${format.argumentCount}'`, format, index, upperFormat)
  if (format.extendFormatList.length !== 0) format.extendFormatList = format.extendFormatList.map((extendFormat, index) => normalizeFormat(extendFormat, index, format))
  return format
}
const getOptionalCheckUpperFormat = (optional, upperFormat) => typeof (optional) === 'function'
  ? (optionMap, optionFormatSet, format) => !optionFormatSet.has(upperFormat) || optional(optionMap, optionFormatSet, format)
  : (optionMap, optionFormatSet, format) => !optionFormatSet.has(upperFormat) || optional

const getParseCLI = (CLINameMap, CLIShortNameMap) => (argvList, optionMap = {}) => {
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
  optionList.forEach(({ format, argumentList }) => (optionMap[ format.name ] = { format, argumentList }))
  return optionMap
}

const getParseENV = (ENVNameMap) => (envObject, optionMap = {}) => {
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

const getParseJSON = (JSONNameMap) => (jsonObject, optionMap = {}) => {
  JSONNameMap.forEach((format, nameJSON) => {
    const value = jsonObject[ nameJSON ]
    if (!value) return
    optionMap[ format.name ] = { format, argumentList: Array.isArray(value) ? value : [ value ] }
  })
  return optionMap
}

const getProcessOptionMap = (nonOptionalFormatSet, optionalFormatCheckSet) => (optionMap, extendOption) => {
  const optionFormatSet = new Set()
  Object.keys(optionMap).forEach((name) => {
    let { format, argumentList } = optionMap[ name ]
    if (format.argumentLengthMin > argumentList.length) throw getProcessError(`expected ${format.argumentLengthMin - argumentList.length} more argument, get: ${JSON.stringify(argumentList)}`, format)
    if (format.argumentLengthMax < argumentList.length) throw getProcessError(`expected ${argumentList.length - format.argumentLengthMax} less argument, get: ${JSON.stringify(argumentList)}`, format)
    __DEV__ && optionFormatSet.has(format) && console.warn(`[processOptionList] get duplicate option: ${formatSimple(format)}`)
    optionMap[ name ].argumentList = argumentList = format.argumentListNormalize(argumentList, extendOption)
    format.argumentListVerify(argumentList, extendOption)
    optionFormatSet.add(format)
  })
  nonOptionalFormatSet.forEach((format) => { if (!optionFormatSet.has(format)) throw getProcessError('non-optional option', format) })
  optionalFormatCheckSet.forEach(({ format, checkOptional }) => { if (!checkOptional(optionMap, optionFormatSet, format) && !optionFormatSet.has(format)) throw getProcessError('non-optional option', format) })
  return optionMap
}
const getProcessError = (message, format) => new Error(`[ERROR][Process] <${formatSimple(format)}> ${message}`)

const formatSimple = ({ name, shortName }) => `${name}${shortName ? ` [-${shortName}]` : ''}`
const formatUsageBase = (text, { optional, argumentLengthMin, argumentLengthMax }) => text +
  (optional ? typeof (optional) === 'function' ? ' [OPTIONAL-CHECK]' : ' [OPTIONAL]' : '') +
  (argumentLengthMin ? ` [ARGUMENT=${argumentLengthMin}${argumentLengthMax === Infinity ? '+' : argumentLengthMax > argumentLengthMin ? `-${argumentLengthMax}` : ''}]` : '')
const formatUsageCLI = (formatList) => formatList.map((format) => (
  formatUsageBase(`--${format.name}${format.shortName ? ` -${format.shortName}` : ''}`, format) +
  (format.description ? `:\n${stringIndentLine(format.description, '    ')}` : '')
)).join('\n')
const formatUsageENV = (formatList) => `"
  #!/bin/bash
${formatList.map((format) => `  export ${format.nameENV}="${formatUsageBase(format.name, format)}"`).join('\n')}
"`
const formatUsageJSON = (formatList) => `{
${formatList.map((format) => `  "${format.nameJSON}": [ "${formatUsageBase(format.name, format)}" ]`).join(',\n')}
}`

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
