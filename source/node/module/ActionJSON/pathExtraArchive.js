import { dirname } from 'node:path'
import { createDirectory } from 'source/node/fs/Directory.js'
import { run } from 'source/node/run.js'

import { check as checkAuto, compressAutoAsync, extractAutoAsync } from 'source/node/module/Archive/archive.js'
import { check as checkNpmTar, compressAsync as compressNpmTarAsync, extractAsync as extractNpmTarAsync } from 'source/node/module/Archive/npmTar.js'
import { check as checkTar, extractArgs as compressArgsTar, extractArgs as extractArgsTar } from 'source/node/module/Archive/tar.js'

const PATH_COMPRESS_TAR = 'path.compress-tar'
const PATH_EXTRACT_TAR = 'path.extract-tar'
const PATH_COMPRESS_AUTO = 'path.compress-auto'
const PATH_EXTRACT_AUTO = 'path.extract-auto'

const ACTION_TYPE = {
  PATH_COMPRESS_TAR,
  PATH_EXTRACT_TAR,
  PATH_COMPRESS_AUTO,
  PATH_EXTRACT_AUTO
}

const ACTION_CORE_MAP = ( // filled based on check result
  checkAuto() && { // support `.7z|.zip|...`, and prefer `.tar` with npm/tar
    [ PATH_COMPRESS_TAR ]: async (sourceDirectory, outputFile) => { await compressAutoAsync(sourceDirectory, outputFile) },
    [ PATH_EXTRACT_TAR ]: async (sourceFile, outputPath) => { await extractAutoAsync(sourceFile, outputPath) },
    [ PATH_COMPRESS_AUTO ]: async (sourceDirectory, outputFile) => { await compressAutoAsync(sourceDirectory, outputFile) },
    [ PATH_EXTRACT_AUTO ]: async (sourceFile, outputPath) => { await extractAutoAsync(sourceFile, outputPath) }
  }
) || (
  checkNpmTar() && { // support `.tar|.tgz` with npm/tar
    [ PATH_COMPRESS_TAR ]: async (sourceDirectory, outputFile) => { await compressNpmTarAsync(sourceDirectory, outputFile) }, // sourceDirectory, outputFile
    [ PATH_EXTRACT_TAR ]: async (sourceFile, outputPath) => { await extractNpmTarAsync(sourceFile, outputPath) } // sourceFile, outputPath
  }
) || (
  checkTar() && { // support `.tar|.tgz` with tar
    [ PATH_COMPRESS_TAR ]: async (sourceDirectory, outputFile) => {
      await createDirectory(dirname(outputFile))
      await run(compressArgsTar(sourceDirectory, outputFile)).promise
    },
    [ PATH_EXTRACT_TAR ]: async (sourceFile, outputPath) => {
      await createDirectory(outputPath)
      await run(extractArgsTar(sourceFile, outputPath)).promise
    }
  }
) || {} // no support

// use `setupActionMap` from `./path.js`

export { ACTION_TYPE, ACTION_CORE_MAP }
