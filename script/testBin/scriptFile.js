const { describe, binary } = require('@dr-js/core/library/common/format')

const { main } = require('./scriptFileSub')

console.log(`[process.argv] ${describe(process.argv)}`)

// NOTE: patched variable
console.log(`[evalArgv] ${evalArgv}`) // eslint-disable-line no-undef
console.log(`[evalOption] ${describe(evalOption)}`) // eslint-disable-line no-undef
console.log(`[__filename] ${describe(__filename)}`)
console.log(`[__dirname] ${describe(__dirname)}`)

console.log(`[binary] ${binary(123456)}`)

main()
