import { resolve, dirname } from 'path'
import { tryRequire } from 'source/env/tryRequire'
import { splitCamelCase } from 'source/common/string'
import { string, number, boolean, integer, basicFunction, arrayLength, oneOf } from 'source/common/verify'
import { objectDeleteUndefined } from 'source/common/immutable/Object'
import { arraySplitChunk } from 'source/common/immutable/Array'
import { createOptionParser } from './parser'

const verifyOneOf = (selectList) => (argumentList) => {
  arrayLength(argumentList, 1)
  oneOf(argumentList[ 0 ], selectList)
}

const getVerifySingle = (typeVerify, typeName) => (argumentList) => {
  arrayLength(argumentList, 1)
  typeVerify(argumentList[ 0 ], `expect ${typeName}`)
}
const getVerifyAll = (typeVerify, typeName) => (argumentList) => {
  argumentList.forEach((v, i) => typeVerify(v, `expect ${typeName} at #${i}`))
}

const getPreset = (argumentCount, argumentListVerify = () => {}, argumentListNormalize = (v) => v, description = '', optional = false) => ({
  argumentCount,
  argumentListNormalize,
  argumentListVerify,
  description,
  optional
})
const getOneOfPreset = (argumentListVerify, argumentListNormalize) => (selectList) => {
  argumentListVerify(selectList)
  return getPreset(1, verifyOneOf(selectList), argumentListNormalize, `one of:\n  ${arraySplitChunk(selectList, 4).map((v) => v.join(' ')).join('\n  ')}`)
}

const ConfigPreset = {
  Optional: { optional: true },
  Path: { isPath: true },
  Any: getPreset('0-', undefined, undefined, 'any', true),
  Toggle: getPreset('0-', undefined, () => ([ true ]), 'set to enable', true)
}
Object.assign(ConfigPreset, ...[
  // typeName, checkTypeFunc, normalizeToTypeFunc
  [ 'String', string, (argumentList) => argumentList.map(String) ],
  [ 'Number', number, (argumentList) => argumentList.map(Number) ],
  [ 'Boolean', boolean, (argumentList) => argumentList.map(Boolean) ],
  [ 'Integer', integer, (argumentList) => argumentList.map(parseInt) ],
  [ 'Function', basicFunction, undefined ] // TODO: should be form JS config only, always optional?
].map(([ typeName, checkTypeFunc, normalizeToTypeFunc ]) => {
  const verifyAllType = getVerifyAll(checkTypeFunc, typeName)
  return {
    [ `Single${typeName}` ]: getPreset(1, getVerifySingle(checkTypeFunc, typeName), normalizeToTypeFunc),
    [ `All${typeName}` ]: getPreset('1-', verifyAllType, normalizeToTypeFunc),
    [ `OneOf${typeName}` ]: normalizeToTypeFunc && getOneOfPreset(verifyAllType, normalizeToTypeFunc)
  }
}))
Object.assign(ConfigPreset, {
  SinglePath: { ...ConfigPreset.SingleString, isPath: true },
  AllPath: { ...ConfigPreset.AllString, isPath: true },
  Config: { // common config preset
    ...ConfigPreset.SingleString,
    optional: true,
    name: 'config',
    shortName: 'c',
    description: [
      `from ENV: set to 'env'`,
      `from JS/JSON file: set to 'path/to/config.js|json'`
    ].join('\n')
  }
})
Object.entries(ConfigPreset).forEach(([ key, value ]) => {
  ConfigPreset[ splitCamelCase(key).map((string) => string.charAt(0).toUpperCase()).join('') ] = value
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
        parseCONFIG(tryRequire(resolve(process.cwd(), config))),
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
    if (!argumentList) throw new Error(`expect option ${name}`)
    if (argumentCount !== undefined && argumentList.length !== argumentCount) throw new Error(`expect option ${name} with ${argumentCount} value, get ${argumentList.length}`)
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

// sample: `name,short-name,...alias-name-list / O,P / 1- |some description, and extra '|' is also allowed` // check test for more
const parseCompactFormat = (format) => {
  const [ compactTag, ...descriptionList ] = format.split('|')
  const [ nameTag, presetTag = '', argumentCount ] = compactTag.split(/\s*[\s/]\s*/)
  const [ name, ...aliasNameList ] = nameTag.split(',')
  const shortName = aliasNameList[ 0 ]
  const presetList = presetTag.split(',')
  return Object.assign(
    {},
    ...presetList.map((presetName) => ConfigPreset[ presetName ]).filter(Boolean),
    objectDeleteUndefined({
      name,
      shortName: (shortName && shortName.length === 1) ? aliasNameList[ 0 ] : undefined,
      aliasNameList,
      argumentCount: argumentCount || undefined,
      description: descriptionList.join('|') || undefined
    })
  )
}

export {
  ConfigPreset,
  getOptionalFormatFlag,
  getOptionalFormatValue,

  parseOptionMap,
  createOptionGetter,
  prepareOption,

  parseCompactFormat
}
