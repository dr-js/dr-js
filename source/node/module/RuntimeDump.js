import { resolve } from 'node:path'
import {
  cachedDataVersionTag,
  getHeapSpaceStatistics,
  getHeapStatistics,
  getHeapSnapshot,
  getHeapCodeStatistics,
  writeHeapSnapshot
} from 'node:v8'

import { getRandomId } from 'source/common/math/random.js'
import { writeJSONSync } from 'source/node/fs/File.js'
import { createDirectorySync } from 'source/node/fs/Directory.js'

const getV8Extra = () => ({
  date: new Date().toISOString(),
  cachedDataVersionTag: cachedDataVersionTag(),
  heapSpaceStatistics: getHeapSpaceStatistics(),
  heapStatistics: getHeapStatistics(),
  heapCodeStatistics: getHeapCodeStatistics()
})

const getV8HeapSnapshotReadableStream = getHeapSnapshot // should pipe to some file
const writeV8HeapSnapshot = writeHeapSnapshot // should pipe to some file

const dumpSync = (path) => {
  createDirectorySync(path)
  const tag = getRandomId()
  // all sync may cause main thread block
  writeV8HeapSnapshot(resolve(path, `runtime-dump-${tag}.heapsnapshot`))
  writeJSONSync(resolve(path, `runtime-dump-${tag}.extra.json`), getV8Extra())
}

const setupSIGUSR2 = (outputPath) => { // linux only
  outputPath = resolve(outputPath)
  // console.log(`[setupSIGUSR2] outputPath: "${outputPath}"`)
  const listener = () => dumpSync(outputPath)
  process.on('SIGUSR2', listener)
  return () => process.off('SIGUSR2', listener)
}

export {
  getV8Extra,
  getV8HeapSnapshotReadableStream,
  writeV8HeapSnapshot,
  dumpSync,
  setupSIGUSR2
}
