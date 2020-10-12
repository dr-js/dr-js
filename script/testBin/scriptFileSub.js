const { splitCamelCase } = require('@dr-js/core/library/common/string')

const main = () => {
  // NOTE: this is normal module value
  console.log(`[__filename] ${__filename}`)
  console.log(`[__dirname] ${__dirname}`)

  console.log(`[splitCamelCase] ${splitCamelCase('splitCamelCase')}`)
}

module.exports = { main }
