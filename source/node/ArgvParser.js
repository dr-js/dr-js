import Dr from '../Dr'

export default class ArgvParser {
  constructor (formatListList) {
    this.keyList = [
      'nodeExecutable',
      'scriptFile'
    ]
    this.formatMap = {
      nodeExecutable: {},
      scriptFile: {}
    }

    formatListList.forEach((formatList) => {
      const key = formatList.shift()
      if (this.formatMap[ key ]) return Dr.assert(false, '[ArgvParser] duplicate argv_key:' + key)
      this.keyList.push(key)
      this.formatMap[ key ] = ArgvParser.parseFormatList(formatList)
    })
  }

  parse (argvList) {
    const argvMap = {}
    this.keyList.forEach((key) => {
      const format = this.formatMap[ key ]
      if (format.isOptional && argvList.length === 0) {
        if (format.isDefaultValue) argvMap[ key ] = format.defaultValue
      } else if (format.isMulti && argvList.length > 0) {
        argvMap[ key ] = argvList
        argvList = []
      } else if (argvList.length > 0) {
        argvMap[ key ] = argvList.shift()
      } else {
        Dr.log(`[Usage] ${this.getUsage()}`)
        Dr.log(`[Get] ${this.getResultArgvUsage(argvMap)}`)
        Dr.log(`[Error]\n -- missing arg:<${key}> left input argv: [${argvList.join(', ')}]`)
        return Dr.global.process.exit(-1)
      }
    })
    return argvMap
  }

  getUsage () {
    return ' - ' + this.keyList.map((v, i) => `[${i}] <${v}> ${this.getFormatUsage(v)}`).join('\n - ')
  }

  getFormatUsage (key) {
    const format = this.formatMap[ key ]
    return (format.isOptional ? ' [OPTIONAL]' : '') +
      (format.isMulti ? ' [MULTI]' : '') +
      (format.isDefaultValue ? (' [DEFAULT = ' + format.defaultValue + ']') : '')
  }

  getResultArgvUsage (argumentMap) {
    return ' - ' + this.keyList.map((v, i) => `[${i}] ${argumentMap[ v ] || `! <${v}>`}`).join('\n - ')
  }

  static TYPE = {
    OPTIONAL: 'OPTIONAL',
    MULTI: 'MULTI',
    DEFAULT: 'DEFAULT'
  }

  static parseFormatList (formatList) {
    const format = {}
    for (let index = 0, indexMax = formatList.length; index < indexMax; index++) {
      switch (formatList[ index ]) {
        case ArgvParser.TYPE.OPTIONAL:
          format.isOptional = true
          break
        case ArgvParser.TYPE.MULTI:
          format.isMulti = true
          break
        case ArgvParser.TYPE.DEFAULT:
          index++
          Dr.assert(index >= indexMax, '[ArgvParser][parseFormatList] Missing value for DEFAULT')
          format.isDefaultValue = true
          format.defaultValue = formatList[ index ] // pick defaultValue from next index
          break
      }
    }
    return format
  }
}
