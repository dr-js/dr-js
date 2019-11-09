import { indentLine, splitKebabCase, joinCamelCase, joinSnakeCase } from 'source/common/string'

// TODO: NOTE: currently all option format must be named, which is good but slightly inconvenient, add a default `_` name?

// const sampleOptionFormatData = {
//   prefixENV: 'prefix-ENV',
//   prefixCONFIG: 'prefix-CONFIG',
//   formatList: [ {
//     name: 'option-name',                                                   // kebab-case (separate words with '-')
//     shortName: 'n',                                                        // optional, default '', single char [A-Za-z] CLI name alias, leading with `-`
//     aliasNameList: [ 'o-n' ],                                              // optional, default [], multi-char CLI name alias, leading with `--`
//     optional: false || (optionMap, optionFormatSet, format) => Boolean,    // optional, default false, can set checkOptional function, checkOptional should return false for non-optional
//     argumentCount: '0-3',                                                  // optional, default 0, can be 0, 1, 2, ... or '0-', '1-6' for range
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
  nameCONFIG: '', // auto append
  shortName: '', // CLI only
  aliasNameList: [], // CLI only
  optional: false, // false || (optionMap, optionFormatSet, format) => true
  argumentCount: '0', // can be number
  argumentLengthMin: 0, // auto append
  argumentLengthMax: 0, // auto append
  argumentListNormalize: (argumentList) => argumentList,
  argumentListVerify: (argumentList) => {},
  description: '',
  extendFormatList: []
}

const createOptionParser = ({ formatList, prefixENV = '', prefixCONFIG = '' }) => {
  const nameMapCLI = new Map()
  const nameMapCLIShort = new Map()
  const nameMapENV = new Map()
  const nameMapCONFIG = new Map()
  const nonOptionalFormatSet = new Set()
  const optionalFormatCheckSet = new Set()

  const parseFormat = (format, index, upperFormat) => {
    const { name, shortName, aliasNameList, argumentCount } = format
    format.nameENV = joinSnakeCase(splitKebabCase(prefixENV ? `${prefixENV}-${name}` : name))
    format.nameCONFIG = joinCamelCase(splitKebabCase(prefixCONFIG ? `${prefixCONFIG}-${name}` : name))

    format.optional = parseOptional(format.optional, upperFormat)

    const [ , argumentLengthMinString, argumentLengthSep, argumentLengthMaxString ] = REGEXP_FORMAT_ARGUMENT_COUNT.exec(String(argumentCount))
    format.argumentLengthMin = parseInt(argumentLengthMinString)
    format.argumentLengthMax = argumentLengthSep
      ? (argumentLengthMaxString ? parseInt(argumentLengthMaxString) : Infinity)
      : format.argumentLengthMin

    nameMapCLI.has(name) && throwFormatError(`duplicate name '${name}'`, format, index, upperFormat)
    nameMapCLI.set(name, format)
    shortName && nameMapCLIShort.has(shortName) && throwFormatError(`duplicate shortName '${shortName}'`, format, index, upperFormat)
    shortName && nameMapCLIShort.set(shortName, format)
    {
      const duplicateAliasName = aliasNameList.find((aliasName) => nameMapCLI.has(aliasName))
      duplicateAliasName && throwFormatError(`duplicate aliasName '${duplicateAliasName}'`, format, index, upperFormat)
      aliasNameList.forEach((aliasName) => nameMapCLI.set(aliasName, format))
    }
    nameMapENV.set(format.nameENV, format)
    nameMapCONFIG.set(format.nameCONFIG, format)
    if (!format.optional) nonOptionalFormatSet.add(format)
    else if (format.optional !== OPTIONAL_TRUE) optionalFormatCheckSet.add({ format, checkOptional: format.optional })

    format.extendFormatList.forEach((extendFormat, index) => parseFormat(extendFormat, index, format))
  }

  formatList = formatList.map((format, index) => normalizeFormat(format, index, null))
  formatList.forEach((format, index) => parseFormat(format, index, null))

  return {
    parseCLI: getParseCLI(getParseArgvList(nameMapCLI, nameMapCLIShort)),
    parseENV: getParseENV(nameMapENV),
    parseCONFIG: getParseCONFIG(nameMapCONFIG),
    processOptionMap: getProcessOptionMap(nonOptionalFormatSet, optionalFormatCheckSet),
    formatUsage: (message, isSimple = false) => join(
      message && `Message:\n${indent(String(message))}`,
      `CLI Usage:\n${indent(usageCLI(formatList))}`,
      !isSimple && `ENV Usage:\n${indent(usageENV(formatList))}`,
      !isSimple && `CONFIG Usage:\n${indent(usageCONFIG(formatList))}`
    )
  }
}
const REGEXP_FORMAT_ARGUMENT_COUNT = /^(\d+)(-)?(\d+)?$/
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
  {
    !REGEXP_FORMAT_ARGUMENT_COUNT.test(format.argumentCount) && throwFormatError(`argumentCount '${format.argumentCount}'`, format, index, upperFormat)
    const [ , from, , to ] = REGEXP_FORMAT_ARGUMENT_COUNT.exec(format.argumentCount)
    to && parseInt(to) < parseInt(from) && throwFormatError(`argumentCount '${format.argumentCount}'`, format, index, upperFormat)
  }
  if (format.extendFormatList.length) format.extendFormatList = format.extendFormatList.map((extendFormat, index) => normalizeFormat(extendFormat, index, format))
  return format
}
const REGEXP_FORMAT_NAME = /^[A-Za-z][A-Za-z0-9-]*$/ // limit name to something like `abc-abc-123`
const REGEXP_FORMAT_SHORT_NAME = /^[A-Za-z]$/ // single character
const throwFormatError = (message, format, index, upperFormat) => { throw new Error(`[Format] ${formatSimple(format)} #${index}${upperFormat ? ` of ${formatSimple(upperFormat)}` : ''} | ${message}`) }

const getParseArgvList = (nameMapCLI, nameMapCLIShort) => (argvList) => {
  const optionList = [ /* { format, argumentList: [] } */ ]
  const getLastOptionArgumentList = () => optionList[ optionList.length - 1 ].argumentList
  for (let index = 0, indexMax = argvList.length; index < indexMax; index++) {
    const value = argvList[ index ]
    if (REGEXP_FORMAT_CLI_NAME.test(value)) { // test name || alias
      const [ , name, , extraArgument ] = REGEXP_FORMAT_CLI_NAME.exec(value)
      const format = nameMapCLI.get(name)
      !format && throwParseArgvError(name, 'invalid option')
      optionList.push({ format, argumentList: [] })
      extraArgument && getLastOptionArgumentList().push(extraArgument)
    } else if (REGEXP_FORMAT_CLI_SHORT_NAME.test(value)) { // test shortName
      const [ , shortNameString, , extraArgument ] = REGEXP_FORMAT_CLI_SHORT_NAME.exec(value)
      shortNameString.split('').forEach((shortName) => {
        const format = nameMapCLIShort.get(shortName)
        !format && throwParseArgvError(shortName, `from '${shortNameString}'`)
        optionList.push({ format, argumentList: [] })
      })
      extraArgument && getLastOptionArgumentList().push(extraArgument)
    } else { // argument
      !optionList.length && throwParseArgvError(value, 'no leading option found')
      if (value !== '--') getLastOptionArgumentList().push(value)
      else { // mark remaining argvList as current option argument
        getLastOptionArgumentList().push(...argvList.slice(index + 1))
        break // skip all remaining
      }
    }
  }
  return optionList
}
const REGEXP_FORMAT_CLI_NAME = /^--([A-Za-z][A-Za-z0-9-]*)(=(.*))?$/ // NOTE: may match one extra argument
const REGEXP_FORMAT_CLI_SHORT_NAME = /^-([A-Za-z]+)(=(.*))?$/ // NOTE: will match merged short command, may match one extra argument
const throwParseArgvError = (arg, detail) => { throw new Error(`[ParseArgv] unexpected '${arg}', ${detail}`) }

const getParseCLI = (parseArgvList) => (argvList, optionMap = {}) => parseArgvList(argvList).reduce((o, { format, argumentList }) => {
  if (o[ format.name ]) o[ format.name ].argumentList.push(...argumentList)
  else o[ format.name ] = { format, argumentList, source: 'CLI' }
  return o
}, optionMap)

const getParseENV = (nameMapENV) => (envObject, optionMap = {}) => {
  nameMapENV.forEach((format, nameENV) => {
    let value = envObject[ nameENV ]
    if (!value) return
    try { value = JSON.parse(value) } catch (error) { __DEV__ && console.log(`[parseENV] not JSON string ${value}`, error) }
    optionMap[ format.name ] = { format, argumentList: Array.isArray(value) ? value : [ value ], source: 'ENV' }
  })
  return optionMap
}

const getParseCONFIG = (nameMapCONFIG) => (object, optionMap = {}) => {
  nameMapCONFIG.forEach((format, nameCONFIG) => {
    const value = object[ nameCONFIG ]
    if (value) optionMap[ format.name ] = { format, argumentList: Array.isArray(value) ? value : [ value ], source: 'CONFIG' }
  })
  return optionMap
}

const getProcessOptionMap = (nonOptionalFormatSet, optionalFormatCheckSet) => (optionMap, extendOption) => {
  const optionFormatSet = new Set()
  Object.entries(optionMap).forEach(([ name, option ]) => {
    const { format, argumentList } = option
    format.argumentLengthMin > argumentList.length && throwProcessError(`expect ${format.argumentLengthMin - argumentList.length} more argument`, format)
    format.argumentLengthMax < argumentList.length && throwProcessError(`expect ${argumentList.length - format.argumentLengthMax} less argument`, format)
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
  formatUsageBase(format, `--${format.name}${format.aliasNameList.length ? ` --${format.aliasNameList.join(' --')}` : ''}`, format.shortName && `-${format.shortName}`),
  format.description && indent(format.description, 4),
  formatExtendList(format.extendFormatList, formatUsageCLI, 2)
)

const usageENV = (formatList) => join('"', indent(`#!/usr/bin/env bash\n${mapJoin(formatList, formatUsageENV)}`), '"')
const formatUsageENV = (format) => join(
  `export ${format.nameENV}="${formatUsageBase(format)}"`,
  formatExtendList(format.extendFormatList, formatUsageENV, 0)
)

const usageCONFIG = (formatList) => join('{', indent(mapJoin(formatList, formatUsageCONFIG)), '}')
const formatUsageCONFIG = (format) => join(
  `"${format.nameCONFIG}": [ "${formatUsageBase(format)}" ],`,
  formatExtendList(format.extendFormatList, formatUsageCONFIG, 0)
)

const formatUsageBase = ({ optional, argumentLengthMin, argumentLengthMax }, ...args) => [
  ...args,
  optional === OPTIONAL_TRUE && '[OPTIONAL]',
  (argumentLengthMin || argumentLengthMax) && `[ARGUMENT=${formatRange(argumentLengthMin, argumentLengthMax)}]`
].filter(Boolean).join(' ')

const formatExtendList = (extendFormatList, formatUsage, indentCount) => extendFormatList.length && indent(mapJoin(extendFormatList, formatUsage), indentCount)
const formatRange = (min, max) => `${min}${max === Infinity ? '+' : (max > min ? `-${max}` : '')}`

const mapJoin = (array, func) => join(...array.map(func))
const join = (...fragList) => fragList.filter(Boolean).join('\n')
const indent = (text, count = 2) => count ? indentLine(text, ' '.repeat(count)) : text

export { createOptionParser }
