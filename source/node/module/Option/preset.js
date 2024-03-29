import { resolve, dirname } from 'node:path'
import { tryRequire } from 'source/env/tryRequire.js'
import { indentLineList, splitCamelCase } from 'source/common/string.js'
import { string, number, boolean, integer, regexp, basicObject, basicFunction, arrayLength, oneOf } from 'source/common/verify.js'
import { tryParseJSONObject } from 'source/common/data/function.js'
import { objectFilter } from 'source/common/immutable/Object.js'
import { arraySplitChunk } from 'source/common/immutable/Array.js'
import { unpackGz64, unpackBr64 } from 'source/node/data/Z64String.js'
import { createOptionParser } from './parser.js'

// TODO: REWRITE/TRIM: usable for now, but too much "magic", need a slim version

const throwError = (message) => { throw new Error(message) }
const filterFormatValue = (value) => value !== undefined && value !== ''

const getPreset = (argumentCount, argumentListVerify, argumentListNormalize, description, optional) => objectFilter({
  argumentCount, argumentListNormalize, argumentListVerify, description, optional
}, filterFormatValue)

const TOGGLE_FALSY = 'false/no/n/0'
const Preset = {
  Optional: { optional: true },
  Path: { isPath: true },
  Any: getPreset('0-', undefined, undefined, 'any', true),
  // TODO: NOTE:
  //   for fast CLI toggle like `-v`, the raw value would be an empty array `[]`
  //   but to support `-v no` or `-v0`, the result will be `[ false ]`
  //   so make sure to get the option with `getToggle|tryGetFirst`, as `Boolean(tryGet('v'))` will fail in the explicit `false` situation
  Toggle: getPreset(
    '0-1',
    undefined,
    (argumentList) => TOGGLE_FALSY.split('/').includes(String(argumentList[ 0 ]).toLowerCase()) ? [ false ] : [ true ],
    `set to ANY value to enable, except "${TOGGLE_FALSY}"`,
    true
  )
}

// Preset: first batch, generated
Object.assign(Preset, ...[
  // typeName, verifyFunc, normalizeFunc
  [ 'String', string, (argumentList) => argumentList.map(String) ],
  [ 'Number', number, (argumentList) => argumentList.map(Number) ],
  [ 'Boolean', boolean, (argumentList) => argumentList.map(Boolean) ],
  [ 'Integer', integer, (argumentList) => argumentList.map(parseInt) ],
  [ 'RegExp', regexp, undefined ], // TODO: limit to JS config, always optional?
  [ 'Object', basicObject, undefined ], // TODO: limit to JS/JSON config, always optional?
  [ 'Function', basicFunction, undefined ] // TODO: limit to JS config, always optional?
].map(([ typeName, verifyFunc, normalizeFunc ]) => {
  const verifySingle = (argumentList) => {
    arrayLength(argumentList, 1)
    verifyFunc(argumentList[ 0 ], `expect ${typeName}`)
  }
  const verifyAllType = (argumentList) => argumentList.forEach((v, i) => verifyFunc(v, `expect ${typeName} at #${i}`))
  return {
    [ `Single${typeName}` ]: getPreset(1, verifySingle, normalizeFunc),
    [ `All${typeName}` ]: getPreset('1-', verifyAllType, normalizeFunc)
  }
}))

const pickOneOf = (selectList, extraDescription = '') => {
  if (selectList.length <= 2) throwError(`expect more to pick: ${selectList}`)
  const argumentListVerify = (argumentList) => {
    arrayLength(argumentList, 1)
    oneOf(argumentList[ 0 ], selectList)
  }
  return getPreset(1, argumentListVerify, undefined, `${extraDescription}one of:\n${indentLineList(arraySplitChunk(selectList, 4).map((v) => v.join(' ')))}`)
}
const parseCompact = ( // sample: `name,short-name,...alias-name-list / O,P / 1- |some description, and extra '|' is also allowed` // check test for more
  compactFormat,
  extraOptionOrExtendFormatList // if pass array, will be used as: `{ extendFormatList: extraOption }`
) => {
  const [ compactTag, ...descriptionList ] = compactFormat.split('|')
  const [ nameTag, presetTag = '', argumentCount ] = compactTag.split(/\s*[\s/]\s*/)
  const nameTagList = nameTag.split(',') // [ name, ...aliasNameList ]
  const presetList = presetTag.split(',')
  return Object.assign(
    {},
    ...presetList.map((presetName) => {
      if (presetName && !Preset[ presetName ]) throwError(`invalid presetName: ${presetName}`)
      return Preset[ presetName ]
    }).filter(Boolean),
    objectFilter({
      name: nameTagList[ 0 ],
      shortName: nameTagList.find((nameTag) => nameTag.length === 1),
      aliasNameList: nameTagList.length > 1 ? nameTagList.slice(1) : undefined,
      argumentCount,
      description: descriptionList.join('|')
    }, filterFormatValue),
    Array.isArray(extraOptionOrExtendFormatList)
      ? { extendFormatList: extraOptionOrExtendFormatList }
      : extraOptionOrExtendFormatList || {}
  )
}
const parseCompactList = (...args) => args.map((compactFormat) => Array.isArray(compactFormat)
  ? parseCompact(...compactFormat)
  : parseCompact(compactFormat)
)

// Preset: second batch, with function
Object.assign(Preset, {
  SinglePath: parseCompact('/SingleString,Path'),
  AllPath: parseCompact('/AllString,Path'),
  Config: parseCompact([
    'config,c/SingleString,Optional|from JS/JSON: set to "path/to/config.js|json"',
    'from ENV: set to "env" to enable, default not check env',
    'from ENV JSON: set to "json-env:ENV_NAME" to read the ENV string as JSON, or "jz64/jb64-env"',
    'from CLI JSON: set to "json-cli:JSON_STRING" to read the appended string as JSON, or "jz64/jb64-cli"'
  ].join('\n')),

  pickOneOf,
  parseCompact,
  parseCompactList
})

// Preset: generate compactName
Object.entries(Preset).forEach(([ key, value ]) => {
  const compactName = splitCamelCase(key).map((string) => string.charAt(0)).join('')
  if (__DEV__ && Preset[ compactName ]) throwError(`duplicate compactName: ${compactName}`)
  Preset[ compactName ] = value
})

// not optional if the format has been set
const getOptionalFormatFlag = (...formatNameList) => (optionMap) => !formatNameList.some((formatName) => Boolean(optionMap[ formatName ]))

// not optional if the format has been set && value match
const getOptionalFormatValue = (formatName, ...valueList) => (optionMap) => {
  const format = optionMap[ formatName ]
  return format && !valueList.includes(format.argumentList[ 0 ])
}

const parseOptionMap = async ({
  parseCLI, parseENV, parseCONFIG, processOptionMap,
  optionCLI = process.argv.slice(2), // TODO: NOTE: process.argv.slice(2) to drop [node executable] [script file], may not good for all situations
  optionENV = process.env
}) => {
  const optionMapCLI = optionMapResolvePathMutate(parseCLI(optionCLI))
  const [ baseString, appendString ] = splitConfigString(optionMapCLI[ 'config' ] && optionMapCLI[ 'config' ].argumentList[ 0 ])
  const optionMapExtra = !baseString ? null
    : baseString === 'env' ? optionMapResolvePathMutate(parseENV(optionENV)) // NOTE: ENV is only parsed when CLI config is set to `env`, the good thing is it's easier to track
      : /^j(son|z64|b64)-env$/.test(baseString) ? optionMapResolvePathMutate(parseCONFIG(tryParseObjectStringAlike(optionENV[ appendString ], baseString) || throwError(`failed to load config: ${baseString}`)))
        : /^j(son|z64|b64)-cli$/.test(baseString) ? optionMapResolvePathMutate(parseCONFIG(tryParseObjectStringAlike(appendString, baseString) || throwError(`failed to load config: ${baseString}`)))
          : optionMapResolvePathMutate(
            parseCONFIG(tryRequire(resolve(baseString)) || throwError(`failed to load config: ${baseString}`)),
            dirname(resolve(baseString))
          )
  const optionMap = processOptionMap({
    ...optionMapExtra, // allow overwrite by CLI
    ...optionMapCLI
  })
  __DEV__ && console.log('[parseOptionMap] get:')
  __DEV__ && Object.keys(optionMap).forEach((name) => console.log(`  - [${name}] ${JSON.stringify(optionMap[ name ])}`))
  return optionMap
}
const splitConfigString = (configString) => {
  const [ baseString, ...appendList ] = !configString ? [] // support missing string
    : (/^j(son|z64|b64)-env:/.test(configString) || /^j(son|z64|b64)-cli:/.test(configString)) ? configString.split(':') // `j*-env/j*-cli`, split at first ':'
      : [ configString ] // `env` or config file path, no append strings
  const appendString = appendList.join(':')
  return [ baseString, appendString ]
}
const optionMapResolvePathMutate = (optionMap, pathRoot = process.cwd()) => { // NOTE: will mutate argumentList in optionMap
  Object.values(optionMap).forEach(({ format: { isPath }, argumentList }) => isPath && argumentList.forEach((v, i) => (argumentList[ i ] = resolve(pathRoot, v))))
  return optionMap
}
const tryParseObjectStringAlike = (string, baseString) => {
  try {
    let jsonString = string // assume json first
    if (baseString.charAt(2) === '6') jsonString = (baseString.charAt(1) === 'z' ? unpackGz64 : unpackBr64)(string)
    return tryParseJSONObject(jsonString, null)
  } catch (error) { __DEV__ && console.warn(error) }
}

const createOptionGetter = (optionMap) => {
  const tryGet = (name) => optionMap[ name ] && optionMap[ name ].argumentList
  const tryGetFirst = (name) => optionMap[ name ] && optionMap[ name ].argumentList[ 0 ]
  const get = (name) => tryGet(name) || throwError(`expect option ${name}`)
  const getFirst = (name) => get(name)[ 0 ]
  const getToggle = (name) => Boolean(tryGetFirst(name))
  const pwd = (name) => { // resolve the `proper-cwd` for the option // TODO: needed? all path option already got resolved
    const pathValue = optionMap[ name ] && (
      optionMap[ name ].format.isPath
        ? getFirst(name) // relative to the path type value
        : ( // relative to config file
          optionMap[ name ].source === 'CONFIG' &&
          !/^env|j(son|z64|b64)-(env|cli)$/.test(splitConfigString(getFirst('config'))[ 0 ]) && // inline config, not file
          getFirst('config')
        )
    )
    return pathValue ? dirname(pathValue) : '' // use the dirname of path typed option, or ''
  }
  return { optionMap, tryGet, tryGetFirst, get, getFirst, getToggle, pwd }
}

const prepareOption = (optionConfig) => {
  const { parseCLI, parseENV, parseCONFIG, processOptionMap, formatUsage } = createOptionParser(optionConfig)
  const parseOption = async ({ optionCLI, optionENV } = {}) => createOptionGetter(await parseOptionMap({ parseCLI, parseENV, parseCONFIG, processOptionMap, optionCLI, optionENV }))
  return { parseOption, formatUsage }
}

export {
  Preset,
  getOptionalFormatFlag,
  getOptionalFormatValue,

  parseOptionMap,
  createOptionGetter,
  prepareOption
}
