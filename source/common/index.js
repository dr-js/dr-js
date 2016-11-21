// polyfill
if (typeof (Object.assign) !== 'function') {
  (() => {
    'use strict'
    Object.assign = function (target) {
      if (target === undefined || target === null) throw new TypeError('Cannot convert undefined or null to object')
      const output = Object(target)
      for (let index = 1, indexMax = arguments.length; index < indexMax; index++) {
        let source = arguments[ index ]
        if (source === undefined || source === null) continue
        for (let nextKey in source) if (source.hasOwnProperty(nextKey)) output[ nextKey ] = source[ nextKey ]
      }
      return output
    }
  })()
}

import * as Extend from './extend'
import Module from './module'

export {
  Extend,
  Module
}

export default {
  Extend,
  Module
}
