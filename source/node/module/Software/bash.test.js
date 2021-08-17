import { resolve } from 'path'
import { readFileSync } from 'fs'
import { strictEqual, truthy } from 'source/common/verify.js'
import { COMMON_STYLE } from 'source/common/module/HTML.js'
import { deleteDirectory, resetDirectory } from 'source/node/fs/Directory.js'
import {
  /* getArgs, setArgs, */ check, verify,
  // runBash, runBashSync,
  // runBashStdout, runBashStdoutSync,
  /* runBashCommand, */ runBashCommandSync,

  // commonBashArgList,
  // joinCommand,
  // commonCommandList,
  // subShellCommandList,

  toHeredocNoMagic, catStringToFileCommand
  // gitFetchBranchCommandList, gitCleanUpCommandList,
  // commonSourceProfileCommandList
} from './bash.js'

const { describe, it, before, after, info = console.log } = globalThis

const TEST_DOC_STRING = String(readFileSync(__filename))

const TEST_ROOT = resolve(__dirname, './test-bash-gitignore/')
const fromRoot = (...args) => resolve(TEST_ROOT, ...args)

before(async () => {
  await resetDirectory(TEST_ROOT)
})
after(async () => {
  await deleteDirectory(TEST_ROOT)
})

describe('Node.Module.Software.bash', () => {
  it('check()', () => truthy(check()))
  it('verify()', verify)

  it('toHeredocNoMagic()', () => {
    info(toHeredocNoMagic(COMMON_STYLE()))
  })

  process.platform !== 'win32' && it('catStringToFileCommand()', () => {
    runBashCommandSync([
      catStringToFileCommand(COMMON_STYLE(), fromRoot('test-cat-string-to-file-0')),
      catStringToFileCommand(TEST_DOC_STRING, fromRoot('test-cat-string-to-file-1'))
    ])
    strictEqual(String(readFileSync(fromRoot('test-cat-string-to-file-0'))), COMMON_STYLE() + '\n')
    strictEqual(String(readFileSync(fromRoot('test-cat-string-to-file-1'))), TEST_DOC_STRING + '\n')
  })
})