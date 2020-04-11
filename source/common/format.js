const typeNameOf = (value) => Object.prototype.toString.call(value).slice(8, -1) // [ object TypeName ] // Object/Array/RegExp/Null/AsyncFunction

const describe = (value) => {
  const valueType = typeNameOf(value) // [ object ValueType ] // Object/Array/RegExp/Null/AsyncFunction
  const valueString = valueType === 'String' ? JSON.stringify(value)
    : valueType === 'Object' ? `{${escapeString(Object.keys(value))}}`
      : valueType === 'Array' ? `[#${value.length}]`
        : valueType === 'RegExp' ? String(value)
          : valueType.endsWith('Function') ? value.name || 'anonymous'
            : escapeString(String(value))
  return `<${valueType}> ${valueString}`
}
const escapeString = (string) => JSON.stringify(string).slice(1, -1)

const percent = (value) => `${(value * 100).toFixed(2)}%`

const twoDigit = (value) => String(Math.floor(value)).padStart(2, '0')
const mediaTime = (value) => { // in second
  const abs = Math.abs(value)
  return `${value < 0 ? '-' : ''}${twoDigit(abs / 60)}:${twoDigit(abs % 60)}`
}

const OVER_THRESHOLD = 0.75

// https://en.wikipedia.org/wiki/Metric_prefix
const DECIMAL_PICO_ = 0.000000000001 // ======= pico    p   10^−12
const DECIMAL_NANO_ = 0.000000001 // ========== nano    n   10^−9
const DECIMAL_MICRO = 0.000001 // ============= micro   μ   10^−6
const DECIMAL_MILLI = 0.001 // ================ milli   m   10^−3
const DECIMAL_BASE_ = 1 // ==================== BASE    @   10^0
const DECIMAL_KILO_ = 1000 // ================= kilo    k   10^3
const DECIMAL_MEGA_ = 1000000 // ============== mega    M   10^6
const DECIMAL_GIGA_ = 1000000000 // =========== giga    G   10^9
const DECIMAL_TERA_ = 1000000000000 // ======== tera    T   10^12
const DECIMAL_PETA_ = 1000000000000000 // ===== peta    P   10^15
const DECIMAL_EXA__ = 1000000000000000000 // == exa     E   10^18
const decimal = (value) => {
  const abs = Math.abs(value) * OVER_THRESHOLD
  return abs === 0 ? '0'
    : abs < DECIMAL_NANO_ ? `${(value / DECIMAL_PICO_).toFixed(2)}pico`
      : abs < DECIMAL_MICRO ? `${(value / DECIMAL_NANO_).toFixed(2)}nano`
        : abs < DECIMAL_MILLI ? `${(value / DECIMAL_MICRO).toFixed(2)}micro`
          : abs < DECIMAL_BASE_ ? `${(value / DECIMAL_MILLI).toFixed(2)}milli`
            : abs < DECIMAL_KILO_ ? `${(value / DECIMAL_BASE_).toFixed(2)}`
              : abs < DECIMAL_MEGA_ ? `${(value / DECIMAL_KILO_).toFixed(2)}kilo`
                : abs < DECIMAL_GIGA_ ? `${(value / DECIMAL_MEGA_).toFixed(2)}mega`
                  : abs < DECIMAL_TERA_ ? `${(value / DECIMAL_GIGA_).toFixed(2)}giga`
                    : abs < DECIMAL_PETA_ ? `${(value / DECIMAL_TERA_).toFixed(2)}tera`
                      : abs < DECIMAL_EXA__ ? `${(value / DECIMAL_PETA_).toFixed(2)}peta`
                        : `${(value / DECIMAL_EXA__).toFixed(2)}exa`
}

const TIME_SEC_ = 1000
const TIME_MIN_ = 1000 * 60
const TIME_HOUR = 1000 * 60 * 60
const TIME_DAY_ = 1000 * 60 * 60 * 24
const time = (value) => { // value should be msec
  const abs = Math.abs(value) * OVER_THRESHOLD
  return abs < TIME_SEC_ ? `${Math.floor(value)}ms`
    : abs < TIME_MIN_ ? `${(value / TIME_SEC_).toFixed(2)}s`
      : abs < TIME_HOUR ? `${(value / TIME_MIN_).toFixed(2)}m`
        : abs < TIME_DAY_ ? `${(value / TIME_HOUR).toFixed(2)}h`
          : `${(value / TIME_DAY_).toFixed(2)}d`
}

// https://en.wikipedia.org/wiki/Binary_prefix
const BINARY_KIBI = 0b10000000000 // ================================= kibi   Ki(IEC)   K(JEDEC)    2^10
const BINARY_MEBI = 0b100000000000000000000 // ======================= mebi   Mi(IEC)   M(JEDEC)    2^20
const BINARY_GIBI = 0b1000000000000000000000000000000 // ============= gibi   Gi(IEC)   G(JEDEC)    2^30
const BINARY_TEBI = 0b10000000000000000000000000000000000000000 // === tebi   Ti(IEC)   T(JEDEC)    2^40
const binary = (value) => {
  const abs = Math.abs(value) * OVER_THRESHOLD
  return abs < BINARY_KIBI ? `${Math.floor(value)}`
    : abs < BINARY_MEBI ? `${(value / BINARY_KIBI).toFixed(2)}Ki`
      : abs < BINARY_GIBI ? `${(value / BINARY_MEBI).toFixed(2)}Mi`
        : abs < BINARY_TEBI ? `${(value / BINARY_GIBI).toFixed(2)}Gi`
          : `${(value / BINARY_TEBI).toFixed(2)}Ti`
}

const padTable = ({
  table, // table: list of row, row: list of cell, like: [ [ 'cell' ], [ 'cell' ] ]
  padFuncList = [],
  cellPad = ' | ',
  rowPad = '\n',
  widthMaxList = table.reduce((o, rowList) => { // max width for each column
    rowList.forEach((value, index) => {
      o[ index ] = Math.max(String(value).length, o[ index ] || 0)
    })
    return o
  }, [])
}) => table.map(
  (rowList) => rowList.map(
    (value, index) => {
      const string = String(value)
      const padFunc = padFuncList[ index ]
      const maxWidth = widthMaxList[ index ]
      return (!padFunc || padFunc === 'L') ? string.padEnd(maxWidth) // left align [default]
        : padFunc === 'R' ? string.padStart(maxWidth) // right align
          : padFunc(string, maxWidth)
    }
  ).join(cellPad)
).join(rowPad)

const prettyStringifyJSON = (value, unfoldLevel = 2, pad = '  ') => {
  const stringifySwitch = (resultList, value, level, padString) => {
    __DEV__ && console.log(' - - Switch', JSON.stringify({ level, padString }))
    if (level >= 1 && value) {
      if (Array.isArray(value)) return stringifyArray(resultList, value, level, padString)
      if (typeof (value) === 'object') return stringifyObject(resultList, value, level, padString)
    }
    const result = JSON.stringify(value)
    const isSkippedResult = result === undefined
    !isSkippedResult && resultList.push(result)
    return isSkippedResult
  }
  const stringifyObject = (resultList, object, level, padString) => {
    const keyList = Object.keys(object)
    __DEV__ && console.log(' - - Object', JSON.stringify({ level, padString, keyListLength: keyList.length }))
    resultList.push('{\n')
    const resultListLength = resultList.length
    const nextLevel = level - 1
    const nextPadString = `${padString}${pad}`
    for (let index = 0, indexMax = keyList.length; index < indexMax; index++) {
      const key = keyList[ index ]
      const value = object[ key ]
      const startIndex = resultList.length
      resultList.push('') // placeholder
      const isSkippedResult = stringifySwitch(resultList, value, nextLevel, nextPadString)
      if (isSkippedResult) resultList.length--
      else {
        resultList[ startIndex ] = `${nextPadString}${JSON.stringify(key)}: `
        resultList.push(',\n')
      }
    }
    resultList[ resultList.length - 1 ] = resultList.length === resultListLength
      ? '{}'
      : `\n${padString}}`
  }
  const stringifyArray = (resultList, array, level, padString) => {
    __DEV__ && console.log(' - - Array', JSON.stringify({ level, padString, arrayLength: array.length }))
    resultList.push('[\n')
    const resultListLength = resultList.length
    const nextLevel = level - 1
    const nextPadString = `${padString}${pad}`
    for (let index = 0, indexMax = array.length; index < indexMax; index++) {
      const value = array[ index ]
      resultList.push(nextPadString)
      const isSkippedResult = stringifySwitch(resultList, value, nextLevel, nextPadString)
      if (isSkippedResult) resultList.push('null')
      resultList.push(',\n')
    }
    resultList[ resultList.length - 1 ] = resultList.length === resultListLength
      ? '[]'
      : `\n${padString}]`
  }

  const resultList = []
  stringifySwitch(resultList, value, Math.max(unfoldLevel, 0) || 0, '')
  return resultList.join('')
}

export {
  typeNameOf,
  describe,
  percent,
  mediaTime,
  decimal,
  time,
  binary,
  padTable,
  prettyStringifyJSON
}
