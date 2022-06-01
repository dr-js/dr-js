import { resolve } from 'node:path'
import {
  probeSync,
  createArgListPack
} from '../function.js'

// NOTE: require 7z@>=16.00 for `-bs` switch
// TODO: NOTE:
//   using p7zip pack/unpack to `.tar` do not preserve file permission, but with `.7z|.zip` do, check: https://sourceforge.net/p/p7zip/discussion/383044/thread/d9d522d2/

// $ 7z
//   7-Zip 18.06 (x64) : Copyright (c) 1999-2018 Igor Pavlov : 2018-12-30
const { getArgs, setArgs, check, verify } = createArgListPack(
  () => probeSync([ '7z' ], '-bs{o|e|p}{0|1|2}') // test for: `-bs{o|e|p}{0|1|2} : set output stream for output/error/progress line`
    ? [ '7z' ]
    : undefined,
  'expect "7z" in PATH with "-bs{o|e|p}{0|1|2}" support'
)

// TODO: need specific -t for archive type?

const compressArgs = (sourceDirectory, outputFile) => [
  ...verify(),
  'a', resolve(outputFile), // can ends with `.7z|.zip|.tar|.gz|...`
  resolve(sourceDirectory, '*'),
  '-bso0', '-bsp0' // mute extra output
]

const extractArgs = (sourceFile, outputPath) => [
  ...verify(),
  'x', resolve(sourceFile),
  `-o${resolve(outputPath)}`,
  '-aoa', // for overwrite existing
  '-bso0', '-bsp0' // mute extra output
]

// TODO: need a way to correctly kill the process on stream fail
// require manual setup piping: https://stackoverflow.com/questions/1359793/programmatically-extract-tar-gz-in-a-single-step-on-windows-with-7-zip/14699663#14699663
// const runCompressStream = async (sourceDirectory, type = '7z') => run({ // subProcess.stdout will be readableStream
//   command: getCommand(),
//   argList: [
//     'a', 'placeholder-name',
//     resolve(sourceDirectory, '*'),
//     `-t${type}`, '-so' // mark archive type and output to stdout
//   ],
//   option: { stdio: [ 'ignore', 'pipe', 'ignore' ] }
// })
// const runExtractStream = async (outputPath, type = '7z') => run({ // subProcess.stdin writableStream
//   command: getCommand(),
//   argList: [
//     'x',
//     `-o${resolve(outputPath)}`,
//     '-aoa', // for overwrite existing
//     `-t${type}`, '-si' // mark archive type and input from stdin
//   ],
//   option: { stdio: [ 'pipe', 'ignore', 'ignore' ] }
// })

export {
  getArgs, setArgs, check, verify,
  compressArgs, extractArgs
}
