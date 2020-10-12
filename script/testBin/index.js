import { resolve } from 'path'

import { runMain } from '@dr-js/dev/module/main'

import { strictEqual } from 'source/common/verify'
import { run } from 'source/node/system/Run'
import { describeSystemPlatform } from 'source/node/system/Status'

const PATH_ROOT = resolve(__dirname, '../../')
const fromRoot = (...args) => resolve(PATH_ROOT, ...args)

const SCRIPT_STRING = `
const { describe } = require('@dr-js/core/library/common/format')
const { describeSystemPlatform } = require('@dr-js/core/library/node/system/Status')

console.log(\`[process.argv] \${describe(process.argv)}\`)

// NOTE: patched variable
console.log(\`[evalArgv] \${evalArgv}\`) 
console.log(\`[evalOption] \${describe(evalOption)}\`)
console.log(\`[__filename] \${describe(__filename)}\`)
console.log(\`[__dirname] \${describe(__dirname)}\`)

console.log(describeSystemPlatform())
`

runMain(async (logger) => {
  {
    logger.padLog('test eval scriptFile')
    const { promise, stdoutPromise } = run({
      command: process.execPath,
      argList: [
        'output-gitignore/bin',
        '--eval', '1', '2', '3 4',
        '-I', 'script/testBin/scriptFile.js'
      ],
      option: { cwd: PATH_ROOT },
      quiet: true
    })
    const stdoutString = String(await promise.then(() => stdoutPromise))
    console.log({ stdoutString })
    strictEqual(stdoutString, [
      '[process.argv] <Array> [#8]',
      '[evalArgv] 1,2,3 4',
      '[evalOption] <Object> {"optionMap","tryGet","tryGetFirst","get","getFirst","pwd"}',
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
    logger.padLog('test eval scriptString')
    const { promise, stdoutPromise } = run({
      command: process.execPath,
      argList: [
        'output-gitignore/bin',
        '--eval', SCRIPT_STRING, '1', '2', '3 4'
      ],
      option: { cwd: PATH_ROOT },
      quiet: true
    })
    const stdoutString = String(await promise.then(() => stdoutPromise))
    console.log({ stdoutString })
    strictEqual(stdoutString, [
      '[process.argv] <Array> [#7]',
      '[evalArgv] 1,2,3 4',
      '[evalOption] <Object> {"optionMap","tryGet","tryGetFirst","get","getFirst","pwd"}',
      `[__filename] <String> ${JSON.stringify(fromRoot('__SCRIPT_STRING__'))}`,
      `[__dirname] <String> ${JSON.stringify(fromRoot(''))}`,
      describeSystemPlatform(),
      ''
    ].join('\n'))
  }
}, 'test-bin')
