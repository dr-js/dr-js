import { resolve, dirname } from 'path'
import { tryRequire } from 'source/env/tryRequire'
import { splitCamelCase } from 'source/common/string'
import { string, number, boolean, integer, basicFunction, arrayLength, oneOf } from 'source/common/verify'
import { objectDeleteUndefined } from 'source/common/immutable/Object'
import { arraySplitChunk } from 'source/common/immutable/Array'
import { createOptionParser } from './parser'

const throwError = (message) => { throw new Error(message) }

const getPreset = (argumentCount, argumentListVerify = () => {}, argumentListNormalize = (v) => v, description = '', optional = false) => ({
  argumentCount,
  argumentListNormalize,
  argumentListVerify,
  description,
  optional
})

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
  [ 'Function', basicFunction, undefined ] // TODO: should be form JS config only, always optional?
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
  extraOption = {} // if pass array, will be used as: `{ extendFormatList: extraOption }`
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
    objectDeleteUndefined({
      name: nameTagList[ 0 ],
      shortName: nameTagList.find((nameTag) => nameTag.length === 1),
      aliasNameList: nameTagList.slice(1),
      argumentCount: argumentCount || undefined,
      description: descriptionList.join('|') || undefined
    }),
    Array.isArray(extraOption)
      ? { extendFormatList: extraOption }
      : extraOption
  )
}
const parseCompactList = (...args) => args.map((compactFormat) => Array.isArray(compactFormat)
  ? parseCompact(...compactFormat)
  : parseCompact(compactFormat)
)

// Preset: second batch, with function
Object.assign(Preset, {
  SinglePath: parseCompact('/SingleString,Path'), // TODO: not suitable for use in `extraOption`, the `name` will be reset to `''`
  AllPath: parseCompact('/AllString,Path'), // TODO: not suitable for use in `extraOption`, the `name` will be reset to `''`
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

const parseOptionMap = async ({ parseCLI, parseENV, parseCONFIG, processOptionMap }) => {
  const optionMapCLI = optionMapResolvePath(parseCLI(process.argv.slice(2)), process.cwd()) // TODO: NOTE: process.argv.slice(2) to drop [node executable] [script file], may not good for all situations
  const config = optionMapCLI[ 'config' ] && optionMapCLI[ 'config' ].argumentList[ 0 ]
  const optionMapExtend = !config ? null
    : config === 'env' ? optionMapResolvePath(parseENV(process.env), process.cwd())
      : optionMapResolvePath(
        parseCONFIG(tryRequire(resolve(process.cwd(), config)) || throwError(`failed to load config: ${config}`)),
        dirname(resolve(process.cwd(), config))
      )
  const optionMap = processOptionMap({
    ...optionMapExtend, // allow overwrite by cli
    ...optionMapCLI
  })
  __DEV__ && console.log('[parseOptionMap] get:')
  __DEV__ && Object.keys(optionMap).forEach((name) => console.log(`  - [${name}] ${JSON.stringify(optionMap[ name ])}`))
  return optionMap
}
const optionMapResolvePath = (optionMap, pathRoot) => { // NOTE: will mutate argumentList in optionMap
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
  return { optionMap, tryGet, tryGetFirst, get, getFirst }
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
