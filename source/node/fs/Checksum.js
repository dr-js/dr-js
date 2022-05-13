import { resolve, relative } from 'node:path'
import { createReadStream } from 'node:fs'
import { createHash } from 'node:crypto'

import { compareString } from 'source/common/compare.js'
import { createAsyncLane, extendAutoSelectLane } from 'source/common/module/AsyncLane.js'

import { setupStreamPipe, readableStreamToBufferAsync } from 'source/node/data/Stream.js'
import { PATH_TYPE, getPathStat, getPathTypeFromStat } from './Path.js'
import { getDirInfoTree, walkDirInfoTree } from './Directory.js'

const getChecksumInfoOfFile = async (
  absolutePath, // absolute path of file
  fromPath // path will relative to this in output file
) => [ // [ 'relative/path', 'hash-bash64' ]
  relative(fromPath, absolutePath),
  (await readableStreamToBufferAsync(setupStreamPipe(
    createReadStream(absolutePath),
    createHash('sha1')
  ))).toString('base64')
]

const getChecksumInfoListOfPath = async (
  path = '.', // relative or absolute path
  fromPath = process.cwd(), // path will relative to this in output file
  checksumInfoList = []
) => {
  path = resolve(fromPath, path) // to absolute path
  const collector = async (filePath) => { checksumInfoList.push(await getChecksumInfoOfFile(filePath, fromPath)) }
  const pathType = getPathTypeFromStat(await getPathStat(path))
  switch (pathType) {
    case PATH_TYPE.File:
      await collector(path)
      break
    case PATH_TYPE.Directory: {
      const { getTailPromise, pushAuto } = extendAutoSelectLane(createAsyncLane({ laneSize: 4 })) // NOTE: too much or too lane will actually be slower
      await walkDirInfoTree(await getDirInfoTree(path), async (dirInfo) => {
        dirInfo.type === PATH_TYPE.File && pushAuto(() => collector(dirInfo.path))
      })
      await getTailPromise()
      break
    }
    default:
      throw new Error(`invalid pathType: ${pathType} for ${path}`)
  }
  return checksumInfoList
}

const getChecksumInfoListOfPathList = async (
  pathList = [], // relative or absolute path
  fromPath = process.cwd(), // path will relative to this in output file
  checksumInfoList = []
) => {
  for (const path of pathList) await getChecksumInfoListOfPath(path, fromPath, checksumInfoList)
  return checksumInfoList
}

const describeChecksumInfoList = (checksumInfoList) => checksumInfoList
  .sort(([ a ], [ b ]) => compareString(a, b))// sort by relativePath so the order is stable
  .map(([ relativePath, hashBase64 ]) => `${hashBase64} ${relativePath}`) // hash first seems better
  .join('\n')

const describeChecksumOfPathList = async ({
  pathList = [], // relative or absolute path
  fromPath = process.cwd() // path will relative to this in output file
}) => describeChecksumInfoList(await getChecksumInfoListOfPathList(pathList, fromPath))

export {
  getChecksumInfoOfFile,
  getChecksumInfoListOfPath,
  getChecksumInfoListOfPathList,

  describeChecksumInfoList,
  describeChecksumOfPathList
}
