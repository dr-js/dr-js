import { runKit } from 'source/node/kit.js'

runKit(async (kit) => {
  await null // wait for TYPE_CHECK_LIST init
  kit.padLog(`check: ${TYPE_CHECK_LIST.length} files`)
  kit.RUN([
    'tsc',
    ...TYPE_CHECK_LIST,
    '--allowJs', '--checkJs', '--noEmit',
    '--baseUrl', './',
    '--target', 'esnext', '--module', 'nodenext'
  ])
}, { title: 'typeCheck.js' })

const TYPE_CHECK_LIST = [
  'source/type.d.ts',

  'source/common/data/ArrayBuffer.js',
  'source/common/data/ArrayBufferPacket.js',
  'source/common/data/Base64.js',
  'source/common/data/CacheMap.js',
  'source/common/data/DataUri.js',
  'source/common/data/function.js',
  'source/common/data/Iter.js',
  'source/common/data/LinkedList.js',
  'source/common/data/ListMap.js',
  'source/common/data/LoopIndex.js',
  'source/common/data/MapMap.js',
  'source/common/data/SaveQueue.js',
  'source/common/data/SetMap.js',
  'source/common/data/Toggle.js',
  'source/common/data/Tree.js',

  'source/common/verify.js',

  'source/common/function.test.js'
]
