import { stringIndentLine, stringListJoinCamelCase } from 'source/common/format'

// const sampleOptionFormatData = {
//   prefixENV: 'prefix-ENV',
//   prefixJSON: 'prefix-JSON',
//   formatList: [ {
//     name: 'option-name',                                                   // separate words with '-'
//     shortName: 'n',                                                        // optional, default '', single char [A-Za-z] CLI name alias, leading with `-`
//     aliasNameList: [ 'o-n' ],                                              // optional, default [], multi-char CLI name alias, leading with `--`
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

const FORMAT_DEFAULT = {
  name: '',
  nameENV: '', // auto append
  nameJSON: '', // auto append
  shortName: '', // CLI only
  aliasNameList: [], // CLI only
  optional: false,
  argumentCount: '0', // or number
  argumentLengthMin: 0, // auto append
  argumentLengthMax: 0, // auto append
  argumentListNormalize: (argumentList) => argumentList,
  argumentListVerify: (argumentList) => {},
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
    const { name, shortName, aliasNameList, argumentCount } = format
    const [ , argumentLengthString, argumentLengthExtendMark ] = REGEXP_FORMAT_ARGUMENT_COUNT.exec(argumentCount.toString())
    format.nameENV = (prefixENV ? `${prefixENV}-${name}` : name).split('-').join('_').toUpperCase()
    format.nameJSON = stringListJoinCamelCase((prefixJSON ? `${prefixJSON}-${name}` : name).split('-'))
    format.optional = parseOptional(format.optional, upperFormat)
    format.argumentLengthMin = argumentLengthExtendMark === '-' ? 0 : parseInt(argumentLengthString)
    format.argumentLengthMax = argumentLengthExtendMark === '+' ? Infinity : parseInt(argumentLengthString)

    CLINameMap.has(name) && throwFormatError(`duplicate name '${name}'`, format, index, upperFormat)
    CLINameMap.set(name, format)
    shortName && CLIShortNameMap.has(shortName) && throwFormatError(`duplicate shortName '${shortName}'`, format, index, upperFormat)
    shortName && CLIShortNameMap.set(shortName, format)
    {
      const duplicateAliasName = aliasNameList.find((aliasName) => CLINameMap.has(aliasName))
      duplicateAliasName && throwFormatError(`duplicate aliasName '${duplicateAliasName}'`, format, index, upperFormat)
      aliasNameList.forEach((aliasName) => CLINameMap.set(aliasName, format))
    }
    ENVNameMap.set(format.nameENV, format)
    JSONNameMap.set(format.nameJSON, format)
    if (!format.optional) nonOptionalFormatSet.add(format)
    else if (format.optional !== OPTIONAL_TRUE) optionalFormatCheckSet.add({ format, checkOptional: format.optional })

    format.extendFormatList.forEach((extendFormat, index) => parseFormat(extendFormat, index, format))
  }

  formatList = formatList.map((format, index) => normalizeFormat(format, index, null))
  formatList.forEach((format, index) => parseFormat(format, index, null))

  return {
    parseCLI: getParseCLI(getParseArgvList(CLINameMap, CLIShortNameMap)),
    parseENV: getParseENV(ENVNameMap),
    parseJSON: getParseJSON(JSONNameMap),
    processOptionMap: getProcessOptionMap(nonOptionalFormatSet, optionalFormatCheckSet),
    formatUsage: (message, isSimple = false) => join(
      message && `Message:\n${indent(message.toString())}`,
      `CLI Usage:\n${indent(usageCLI(formatList))}`,
      !isSimple && `ENV Usage:\n${indent(usageENV(formatList))}`,
      !isSimple && `JSON Usage:\n${indent(usageJSON(formatList))}`
    )
  }
}
const REGEXP_FORMAT_ARGUMENT_COUNT = /(\d+)([+-])?/
const parseOptional = (optional, upperFormat) => {
  if (typeof (optional) !== 'function') optional = optional ? OPTIONAL_TRUE : false
  return !upperFormat ? optional
    : (optionMap, optionFormatSet, format) => (optional && optional(optionMap, optionFormatSet, format)) || !optionFormatSet.has(upperFormat)
}
const OPTIONAL_TRUE = () => true

const normalizeFormat = (format, index, upperFormat) => {
  format = { ...FORMAT_DEFAULT, ...format }
  !REGEXP_FORMAT_NAME.test(format.name) && throwFormatError(`name '${format.name}'`, format, index, upperFormat)
  format.shortName && !REGEXP_FORMAT_SHORT_NAME.test(format.shortName) && throwFormatError(`shortName '${format.shortName}'`, format, index, upperFormat)
  {
    const errorIndex = format.aliasNameList.findIndex((aliasName) => !REGEXP_FORMAT_NAME.test(aliasName))
    errorIndex !== -1 && throwFormatError(`aliasNameList #${errorIndex} '${format.aliasNameList[ errorIndex ]}'`, format, index, upperFormat)
  }
  !REGEXP_FORMAT_ARGUMENT_COUNT.test(format.argumentCount) && throwFormatError(`argumentCount '${format.argumentCount}'`, format, index, upperFormat)
  if (format.extendFormatList.length) format.extendFormatList = format.extendFormatList.map((extendFormat, index) => normalizeFormat(extendFormat, index, format))
  return format
}
const REGEXP_FORMAT_NAME = /^[A-Za-z][A-Za-z0-9-]*$/ // limit name to something like `abc-abc-123`
const REGEXP_FORMAT_SHORT_NAME = /^[A-Za-z]$/ // single character
const throwFormatError = (message, format, index, upperFormat) => { throw new Error(`[Format] ${formatSimple(format)} #${index}${upperFormat ? ` of ${formatSimple(upperFormat)}` : ''} | ${message}`) }

const getParseArgvList = (CLINameMap, CLIShortNameMap) => (argvList) => {
  const optionList = [ /* { format, argumentList: [] } */ ]
  const getLastOptionArgumentList = () => optionList[ optionList.length - 1 ].argumentList
  for (let index = 0, indexMax = argvList.length; index < indexMax; index++) {
    const value = argvList[ index ]
    if (REGEXP_FORMAT_CLI_NAME.test(value)) { // test name || alias
      const [ , name, , extraArgument ] = REGEXP_FORMAT_CLI_NAME.exec(value)
      const format = CLINameMap.get(name)
      !format && throwParseArgvError(name)
      optionList.push({ format, argumentList: [] })
      extraArgument && getLastOptionArgumentList().push(extraArgument)
    } else if (REGEXP_FORMAT_CLI_SHORT_NAME.test(value)) { // test shortName
      const [ , shortNameString, , extraArgument ] = REGEXP_FORMAT_CLI_SHORT_NAME.exec(value)
      shortNameString.split('').forEach((shortName) => {
        const format = CLIShortNameMap.get(shortName)
        !format && throwParseArgvError(shortName, `from '${shortNameString}'`)
        optionList.push({ format, argumentList: [] })
      })
      extraArgument && getLastOptionArgumentList().push(extraArgument)
    } else { // argument
      !optionList.length && throwParseArgvError(value, 'no leading option found')
      if (value === '--') getLastOptionArgumentList().push(...argvList.slice(index)) // mark remaining argvList as current option argument
      else getLastOptionArgumentList().push(value)
    }
  }
  return optionList
}
const REGEXP_FORMAT_CLI_NAME = /^--([A-Za-z][A-Za-z0-9-]*)(=(.*))?$/ // NOTE: may match one extra argument
const REGEXP_FORMAT_CLI_SHORT_NAME = /^-([A-Za-z]+)(=(.*))?$/ // NOTE: will match merged short command, may match one extra argument
const throwParseArgvError = (arg, detail = 'invalid option') => { throw new Error(`[ParseArgv] unexpected '${arg}', ${detail}`) }

const getParseCLI = (parseArgvList) => (argvList, optionMap = {}) => parseArgvList(argvList).reduce((o, { format, argumentList }) => {
  if (o[ format.name ]) o[ format.name ].argumentList.push(...argumentList)
  else o[ format.name ] = { format, argumentList, source: 'CLI' }
  return o
}, optionMap)

const getParseENV = (ENVNameMap) => (envObject, optionMap = {}) => {
  ENVNameMap.forEach((format, nameENV) => {
    let value = envObject[ nameENV ]
    if (!value) return
    try { value = JSON.parse(value) } catch (error) { __DEV__ && console.log(`[parseENV] not JSON string ${value}`, error) }
    optionMap[ format.name ] = { format, argumentList: Array.isArray(value) ? value : [ value ], source: 'ENV' }
  })
  return optionMap
}

const getParseJSON = (JSONNameMap) => (jsonObject, optionMap = {}) => {
  JSONNameMap.forEach((format, nameJSON) => {
    const value = jsonObject[ nameJSON ]
    if (value) optionMap[ format.name ] = { format, argumentList: Array.isArray(value) ? value : [ value ], source: 'JSON' }
  })
  return optionMap
}

const getProcessOptionMap = (nonOptionalFormatSet, optionalFormatCheckSet) => (optionMap, extendOption) => {
  const optionFormatSet = new Set()
  Object.entries(optionMap).forEach(([ name, option ]) => {
    const { format, argumentList } = option
    format.argumentLengthMin > argumentList.length && throwProcessError(`expected ${format.argumentLengthMin - argumentList.length} more argument`, format)
    format.argumentLengthMax < argumentList.length && throwProcessError(`expected ${argumentList.length - format.argumentLengthMax} less argument`, format)
    __DEV__ && optionFormatSet.has(format) && console.warn(`[processOptionList] get duplicate option: ${formatSimple(format)}`)
    option.argumentList = format.argumentListNormalize(argumentList, extendOption)
    format.argumentListVerify(option.argumentList, extendOption)
    optionFormatSet.add(format)
  })
  nonOptionalFormatSet.forEach((format) => !optionFormatSet.has(format) && throwProcessError('non-optional option', format))
  optionalFormatCheckSet.forEach(({ format, checkOptional }) => !checkOptional(optionMap, optionFormatSet, format) && !optionFormatSet.has(format) && throwProcessError('non-optional option', format))
  return optionMap
}
const throwProcessError = (message, format) => { throw new Error(`[Process] ${formatSimple(format)} | ${message}`) }
const formatSimple = ({ name, shortName, aliasNameList }) => `${name}${aliasNameList.length ? `|${aliasNameList.join('|')}` : ''}${shortName ? ` [-${shortName}]` : ''}`

const usageCLI = (formatList) => mapJoin(formatList, formatUsageCLI)
const formatUsageCLI = (format) => join(
  formatUsageBase(format, `--${format.name}${format.aliasNameList.length ? `|${format.aliasNameList.join('|')}` : ''}`, format.shortName && `-${format.shortName}`),
  format.description && indent(format.description, 4),
  formatExtendList(format.extendFormatList, formatUsageCLI, 2)
)

const usageENV = (formatList) => join('"', indent(`#!/usr/bin/env bash\n${mapJoin(formatList, formatUsageENV)}`), '"')
const formatUsageENV = (format) => join(
  `export ${format.nameENV}="${formatUsageBase(format)}"`,
  formatExtendList(format.extendFormatList, formatUsageENV, 0)
)

const usageJSON = (formatList) => join('{', indent(mapJoin(formatList, formatUsageJSON)), '}')
const formatUsageJSON = (format) => join(
  `"${format.nameJSON}": [ "${formatUsageBase(format)}" ],`,
  formatExtendList(format.extendFormatList, formatUsageJSON, 0)
)

const formatUsageBase = ({ optional, argumentLengthMin, argumentLengthMax }, ...args) => [
  ...args,
  optional && (optional === OPTIONAL_TRUE ? '[OPTIONAL]' : '[OPTIONAL-CHECK]'),
  argumentLengthMin && `[ARGUMENT=${formatRange(argumentLengthMin, argumentLengthMax)}]`
].filter(Boolean).join(' ')

const formatExtendList = (extendFormatList, formatUsage, indentCount) => extendFormatList.length && indent(mapJoin(extendFormatList, formatUsage), indentCount)
const formatRange = (min, max) => `${min}${max === Infinity ? '+' : max > min ? `-${max}` : ''}`

const mapJoin = (array, func) => join(...array.map(func))
const join = (...fragList) => fragList.filter(Boolean).join('\n')
const indent = (text, count = 2) => count ? stringIndentLine(text, ' '.repeat(count)) : text

export { createOptionParser }
