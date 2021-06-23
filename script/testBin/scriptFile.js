const { describe, binary } = require('@dr-js/core/library/common/format.js')

const { main } = require('./scriptFileSub.js')

console.log(`[process.argv.length] ${process.argv.length}`)

// NOTE: patched variable
console.log(`[evalArgv] ${evalArgv}`) // eslint-disable-line no-undef
console.log(`[evalOption] ${describe(evalOption)}`) // eslint-disable-line no-undef
console.log(`[__filename] ${describe(__filename)}`)
console.log(`[__dirname] ${describe(__dirname)}`)

console.log(`[binary] ${binary(123456)}`)

main()
