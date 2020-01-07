import { resolve, dirname } from 'path'
import { tryRequire } from 'source/env/tryRequire'
import { splitCamelCase } from 'source/common/string'
import { string, number, boolean, integer, regexp, basicObject, basicFunction, arrayLength, oneOf } from 'source/common/verify'
import { objectFilter } from 'source/common/immutable/Object'
import { arraySplitChunk } from 'source/common/immutable/Array'
import { createOptionParser } from './parser'

const throwError = (message) => { throw new Error(message) }
const filterFormatValue = (value) => value !== undefined && value !== ''

const getPreset = (argumentCount, argumentListVerify, argumentListNormalize, description, optional) => objectFilter({
  argumentCount, argumentListNormalize, argumentListVerify, description, optional
}, filterFormatValue)

const Preset = {
  Optional: { optional: true },
  Path: { isPath: true },
  Any: getPreset('0-', undefined, undefined, 'any', true),
  Toggle: getPreset('0-', undefined, () => ([ true ]), 'set to enable', true)
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

const pickOneOf = (selectList) => {
  if (selectList.length <= 2) throwError(`expect more to pick: ${selectList}`)
  const argumentListVerify = (argumentList) => {
    arrayLength(argumentList, 1)
    oneOf(argumentList[ 0 ], selectList)
  }
  return getPreset(1, argumentListVerify, undefined, `one of:\n  ${arraySplitChunk(selectList, 4).map((v) => v.join(' ')).join('\n  ')}`)
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
      argumentCount: argumentCount,
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
  Config: parseCompact('config,c/SingleString,Optional|from ENV: set to "env"\nfrom JS/JSON file: set to "path/to/config.js|json"'),

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
  const configString = optionMapCLI[ 'config' ] && optionMapCLI[ 'config' ].argumentList[ 0 ]
  const optionMapExtra = !configString ? null
    : configString === 'env' ? optionMapResolvePathMutate(parseENV(optionENV)) // TODO: NOTE: currently ENV is only parsed when CLI config is set to `env`, the good thing is it's easier to track
      : optionMapResolvePathMutate(
        parseCONFIG(tryRequire(resolve(configString)) || throwError(`failed to load config: ${configString}`)),
        dirname(resolve(configString))
      )
  const optionMap = processOptionMap({
    ...optionMapExtra, // allow overwrite by CLI
    ...optionMapCLI
  })
  __DEV__ && console.log('[parseOptionMap] get:')
  __DEV__ && Object.keys(optionMap).forEach((name) => console.log(`  - [${name}] ${JSON.stringify(optionMap[ name ])}`))
  return optionMap
}
const optionMapResolvePathMutate = (optionMap, pathRoot = process.cwd()) => { // NOTE: will mutate argumentList in optionMap
  Object.values(optionMap).forEach(({ format: { isPath }, argumentList }) => isPath && argumentList.forEach((v, i) => (argumentList[ i ] = resolve(pathRoot, v))))
  return optionMap
}

const createOptionGetter = (optionMap) => {
  const tryGet = (name) => optionMap[ name ] && optionMap[ name ].argumentList
  const tryGetFirst = (name) => optionMap[ name ] && optionMap[ name ].argumentList[ 0 ]
  const get = (name, argumentCount) => {
    const argumentList = tryGet(name)
    if (!argumentList) throwError(`expect option ${name}`)
    if (argumentCount !== undefined && argumentList.length !== argumentCount) throwError(`expect option ${name} with ${argumentCount} value, get ${argumentList.length}`)
    return argumentList
  }
  const getFirst = (name) => get(name, 1)[ 0 ]
  const resolvePath = (name, ...args) => {
    const pathOptionValue = optionMap[ name ] && (
      optionMap[ name ].format.isPath
        ? optionMap[ name ].argumentList[ 0 ] // relative to the value
        : optionMap[ name ].source === 'CONFIG' && optionMap[ 'config' ].argumentList[ 0 ] // relative to config file
    )
    return resolve(pathOptionValue ? dirname(pathOptionValue) : process.cwd(), ...args) // use the dirname of path typed option, or default to cwd
  }
  return { optionMap, tryGet, tryGetFirst, get, getFirst, resolvePath }
}

const prepareOption = (optionConfig) => {
  const { parseCLI, parseENV, parseCONFIG, processOptionMap, formatUsage } = createOptionParser(optionConfig)
  const parseOption = async () => createOptionGetter(await parseOptionMap({ parseCLI, parseENV, parseCONFIG, processOptionMap }))
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
