import { resolve } from 'path'
import { probeSync, createArgListPack } from '../function.js'

// $ tar --version
//   tar (GNU tar) 1.28
// > tar --version
//   bsdtar 3.3.2 - libarchive 3.3.2 zlib/1.2.5.f-ipp
const { getArgs, setArgs, check, verify } = createArgListPack(
  () => probeSync([ 'tar', '--version' ], 'tar')
    ? [ 'tar' ]
    : undefined,
  'expect "tar" in PATH'
)

const compressArgs = (sourceDirectory, outputFile) => [
  ...verify(),
  (outputFile.endsWith('gz') ? '-zcf' : '-cf'), resolve(outputFile),
  '-C', resolve(sourceDirectory),
  '.' // TODO: NOTE: the result tar will have a `./` as root folder, but this will get resolved and disappear after extract
]

const extractArgs = (sourceFile, outputPath) => [
  ...verify(),
  '-xf', resolve(sourceFile), // use '-xf' for both gzip/xz, check: https://unix.stackexchange.com/questions/253596/tar-extraction-also-automatically-decompresses
  '-C', resolve(outputPath)
]

export {
  getArgs, setArgs, check, verify,
  compressArgs, extractArgs
}