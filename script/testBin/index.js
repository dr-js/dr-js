import { resolve } from 'node:path'

import { strictEqual } from 'source/common/verify.js'
import { autoEllipsis } from 'source/common/string.js'
import { runStdout } from 'source/node/run.js'
import { describeSystemPlatform } from 'source/node/system/Status.js'
import { runKit } from 'source/node/kit.js'

const PATH_ROOT = resolve(__dirname, '../../')
const fromRoot = (...args) => resolve(PATH_ROOT, ...args)

const SCRIPT_STRING = `
const { describe } = require('@dr-js/core/library/common/format.js')
const { describeSystemPlatform } = require('@dr-js/core/library/node/system/Status.js')

console.log(\`[process.argv.length] \${process.argv.length}\`)

// NOTE: patched variable
console.log(\`[evalArgv] \${evalArgv}\`) 
console.log(\`[evalOption.optionMap] \${describe(evalOption.optionMap)}\`)
console.log(\`[__filename] \${describe(__filename)}\`)
console.log(\`[__dirname] \${describe(__dirname)}\`)

console.log(describeSystemPlatform())
`

runKit(async (kit) => {
  {
    kit.padLog('test eval scriptFile')
    const stdoutString = String(await runStdout([
      process.execPath,
      'output-gitignore/bin',
      '--eval', '1', '2', '3 4',
      '-I', 'script/testBin/scriptFile.js'
    ], { cwd: PATH_ROOT }))
    console.log({ stdoutString })
    strictEqual(stdoutString, [
      '[process.argv.length] 8',
      '[evalArgv] 1,2,3 4',
      '[evalOption] <Object> {"optionMap","tryGet","tryGetFirst","get","getFirst","getToggle","pwd"}',
      `[__filename] <String> ${JSON.stringify(fromRoot('script/testBin/scriptFile.js'))}`,
      `[__dirname] <String> ${JSON.stringify(fromRoot('script/testBin'))}`,
      '[binary] 120.56Ki',
      `[__filename] ${fromRoot('script/testBin/scriptFileSub.js')}`,
      `[__dirname] ${fromRoot('script/testBin')}`,
      '[splitCamelCase] split,Camel,Case',
      ''
    ].join('\n'))
  }

  {
    kit.padLog('test eval scriptString')
    const stdoutString = String(await runStdout([
      process.execPath,
      'output-gitignore/bin',
      '--eval', SCRIPT_STRING, '1', '2', '3 4'
    ], { cwd: PATH_ROOT }))
    console.log({ stdoutString })
    strictEqual(stdoutString, [
      '[process.argv.length] 7',
      '[evalArgv] 1,2,3 4',
      '[evalOption.optionMap] <Object> {"eval"}',
      `[__filename] <String> ${JSON.stringify(fromRoot('__SCRIPT_STRING__'))}`,
      `[__dirname] <String> ${JSON.stringify(fromRoot(''))}`,
      describeSystemPlatform(),
      ''
    ].join('\n'))
  }

  {
    kit.padLog('test fetchWithJumpProxy')
    const stdoutString = String(await runStdout([
      process.execPath,
      'output-gitignore/bin',
      '--fetch', 'https://dr.run'
    ], { cwd: PATH_ROOT }))
    console.log({ stdoutString: autoEllipsis(stdoutString, 512, 256, 64) })
  }
}, { title: 'test-bin' })
