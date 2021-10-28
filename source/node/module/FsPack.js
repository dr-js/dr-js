import { resolve, relative, dirname } from 'path'
import { createReadStream, createWriteStream, promises as fsAsync } from 'fs'

import { catchAsync } from 'source/common/error.js'
import { bufferToReadableStream, quickRunletFromStream } from 'source/node/data/Stream.js'
import { PATH_TYPE, toPosixPath } from 'source/node/fs/Path.js'
import { getDirInfoTree, walkDirInfoTree, createDirectory } from 'source/node/fs/Directory.js'

// TODO: block symlink with error on win32 since it by default cannot be created?

/** fsPack (suggest `.fsp` extension)
 * feature
 *   support file mode, currently record isExecutable only, like Git
 *   // TODO: should support concat multiple FsPack and unpack? how have offset, but no auto unpack multiple yet
 *   // TODO: should support pack to a writableStream? but this is conflict with how headerOffset is set at last
 *   // TODO: consider add faster binary in-place reorder with http://man7.org/linux/man-pages/man2/copy_file_range.2.html
 *
 * structure
 *   binary layout
 *     "FSP" + versionByte (3+1byte) for fast version test
 *     headerOffset (4byte|number) point to headerLength
 *     fileBuffer#0
 *     fileBuffer#1
 *     fileBuffer#2
 *     ...
 *     headerLength (4byte|number) this allows pack to easily append, just add file from here and then seal with new headerJSON
 *     headerJSON (string)
 *
 *   headerJSON
 *     {
 *       contentList: [ // ordered list
 *         { type: TYPE_FILE, route: 'a/b/file', size: 10, isExecutable: false }, // offset start can be calc from size, so not saved in header
 *         { type: TYPE_DIRECTORY, route: 'a/b/dir' },
 *         { type: TYPE_SYMLINK, route: 'a/b/symlink', target: 'relative/or/absolute/path' },
 *       ]
 *     }
 */

const UINT32_MAX = 0xffffffff // 4GiB
const UINT32_BYTE_SIZE = 4 // Math.ceil(Math.log2(UINT32_MAX) / 8)

const HEADER_VERSION_UINT32 = 0x46535001 // `0x${Buffer.from('FSP\x01').readUInt32BE(0).toString(16)}`
// ver1: add symlink, use JSON for route/target string so `\n`, `\r` will be properly escaped.

const KEY_CONTENT_COMPACT = 'cc'

const TYPE_FILE = 'f'
const TYPE_DIRECTORY = 'd'
const TYPE_SYMLINK = 's'

const FILE_FLAG_READ_ONLY = 'r'
const FILE_FLAG_EDIT = 'r+' // fail if not exist
const FILE_FLAG_CREATE = 'w+' // will reset existing

const fileModeToIsExecutable = (mode) => Boolean(mode & 0o111)
const isExecutableToFileMode = (isExecutable) => isExecutable ? 0o755 : 0o644 // same as git

const toRoute = (packRoot, path) => toPosixPath(relative(packRoot, path))

const autoOpenFsPack = async (asyncFunc, fsPack, openFlag, extra) => {
  const { packPath, packFh } = fsPack
  if (packFh) return asyncFunc(packFh, fsPack, extra)
  const packFhAuto = await fsAsync.open(packPath, openFlag)
  const { result, error } = await catchAsync(asyncFunc, packFhAuto, fsPack, extra)
  await packFhAuto.close()
  if (error) throw error
  return result
}

const readBuffer = async (packFh, offset, size, buffer = Buffer.allocUnsafe(size)) => {
  await packFh.read(buffer, 0, size, offset)
  return buffer
}
const readHeaderNumberList = async (packFh, offset, count = 1) => {
  const buffer = await readBuffer(packFh, offset, count * UINT32_BYTE_SIZE)
  const numberList = []
  for (let index = 0; index < count; index++) numberList.push(buffer.readUInt32BE(index * UINT32_BYTE_SIZE))
  return numberList
}

const writeBuffer = async (packFh, offset, buffer) => packFh.write(buffer, 0, buffer.length, offset)
const writeHeaderNumberList = async (packFh, offset, numberList) => {
  const buffer = Buffer.allocUnsafe(numberList.length * UINT32_BYTE_SIZE)
  for (let index = 0; index < numberList.length; index++) buffer.writeUInt32BE(numberList[ index ], index * UINT32_BYTE_SIZE)
  return writeBuffer(packFh, offset, buffer)
}

const parseHeaderJSON = (buffer) => {
  const { [ KEY_CONTENT_COMPACT ]: contentCompact = '' } = JSON.parse(String(buffer))
  const contentList = !contentCompact ? [] : contentCompact.split('\r').map((contentCompact) => {
    const contentCompactList = contentCompact.split('\n')
    const typeCompactList = contentCompactList[ 0 ].split(' ')
    switch (typeCompactList[ 0 ]) {
      case TYPE_FILE: {
        const [ , routeJSON ] = contentCompactList
        const [ type, sizeBase36, isExecutableMark ] = typeCompactList
        return { type, route: JSON.parse(routeJSON), size: parseInt(sizeBase36, 36), isExecutable: isExecutableMark === 'E' }
      }
      case TYPE_DIRECTORY: {
        const [ , routeJSON ] = contentCompactList
        const [ type ] = typeCompactList
        return { type, route: JSON.parse(routeJSON) }
      }
      case TYPE_SYMLINK: {
        const [ , routeJSON, targetJSON ] = contentCompactList
        const [ type ] = typeCompactList
        return { type, route: JSON.parse(routeJSON), target: JSON.parse(targetJSON) }
      }
      default:
        throw new Error(`unsupported content type: ${typeCompactList[ 0 ]} ${JSON.stringify({ contentCompactList, typeCompactList })}`)
    }
  })
  return { contentList }
}

const packHeaderJSON = (headerJSON) => {
  const { contentList } = headerJSON
  const contentCompact = contentList.map((content) => {
    switch (content.type) {
      case TYPE_FILE: {
        const { type, route, size, isExecutable } = content
        return [ [ type, size.toString(36), isExecutable ? 'E' : '' ].join(' ').trim(), JSON.stringify(route) ].join('\n')
      }
      case TYPE_DIRECTORY: {
        const { type, route } = content
        return [ type, JSON.stringify(route) ].join('\n')
      }
      case TYPE_SYMLINK: {
        const { type, route, target } = content
        return [ type, JSON.stringify(route), JSON.stringify(target) ].join('\n')
      }
      default:
        throw new Error(`unsupported content type: ${content.type}`)
    }
  }).join('\r')
  // __DEV__ && console.log(JSON.stringify({ [ KEY_CONTENT_COMPACT ]: contentCompact }))
  return Buffer.from(JSON.stringify({ [ KEY_CONTENT_COMPACT ]: contentCompact }))
}

const readFsPackHeader = async (packFh, fsPack) => {
  const { offset } = fsPack
  const [ headerVersion, headerOffset ] = await readHeaderNumberList(packFh, offset, 2)
  if (headerVersion >> 8 !== HEADER_VERSION_UINT32 >> 8) throw new Error(`not fsPack: ${headerVersion.toString(36)}, expect: ${HEADER_VERSION_UINT32.toString(36)}`)
  if ((headerVersion & 0xff) !== (HEADER_VERSION_UINT32 & 0xff)) throw new Error(`mismatch version: ${headerVersion & 0xff}`)
  if (!(headerOffset >= 2 * UINT32_BYTE_SIZE && headerOffset <= UINT32_MAX)) throw new Error(`invalid headerOffset: ${headerOffset}`)
  const [ headerLength ] = await readHeaderNumberList(packFh, offset + headerOffset, 1)
  const headerJSON = parseHeaderJSON(await readBuffer(packFh, offset + headerOffset + UINT32_BYTE_SIZE, headerLength))
  fsPack.headerOffset = headerOffset
  fsPack.headerJSON = headerJSON
}
const writeFsPackHeader = async (packFh, fsPack) => {
  const { offset, headerOffset, headerJSON } = fsPack
  await writeHeaderNumberList(packFh, offset, [ HEADER_VERSION_UINT32, headerOffset ])
  const headerJSONBuffer = packHeaderJSON(headerJSON)
  await writeHeaderNumberList(packFh, offset + headerOffset, [ headerJSONBuffer.length ])
  await writeBuffer(packFh, offset + headerOffset + UINT32_BYTE_SIZE, headerJSONBuffer)
}
const writeFsPackAppendFile = async (packFh, fsPack, {
  path, route = toRoute(fsPack.packRoot, path), size, isExecutable,
  stat, buffer, readStream // optional
}) => {
  if (!size || !isExecutable) {
    if (!stat) stat = await fsAsync.stat(path)
    if (!size) size = stat.size
    if (!isExecutable) isExecutable = fileModeToIsExecutable(stat.mode)
  }
  if (!readStream) readStream = buffer ? bufferToReadableStream(buffer) : createReadStream(path)
  const writeStream = createWriteStream(fsPack.packPath, { fd: packFh.fd, start: fsPack.offset + fsPack.headerOffset, autoClose: false })
  await quickRunletFromStream(readStream, writeStream)
  fsPack.headerOffset += size
  fsPack.headerJSON.contentList.push({ type: TYPE_FILE, route, size, isExecutable })
}
const editFsPackAppendDirectory = async (fsPack, { path, route = toRoute(fsPack.packRoot, path) }) => { fsPack.headerJSON.contentList.push({ type: TYPE_DIRECTORY, route }) }
const editFsPackAppendSymlink = async (fsPack, { path, route = toRoute(fsPack.packRoot, path), target }) => {
  if (!target) target = await fsAsync.readlink(path)
  fsPack.headerJSON.contentList.push({ type: TYPE_SYMLINK, route, target })
}

const unpackFsPackFile = async (packFh, fsPack, {
  route, size, isExecutable,
  buffer, writeStream // optional
}) => {
  const { packPath, unpackPath, fastCache } = fsPack
  const { offsetSum } = fastCache.contentMap[ route ]
  const path = resolve(unpackPath, route)
  await createDirectory(dirname(path))
  if (buffer) await readBuffer(packFh, offsetSum, size, buffer)
  else {
    const option = { mode: isExecutableToFileMode(isExecutable) }
    if (writeStream || size >= 64 * 1024) await quickRunletFromStream(createReadStream(packPath, { fd: packFh.fd, start: offsetSum, end: offsetSum + size - 1, autoClose: false }), writeStream || createWriteStream(path, option))
    else if (size > 0) await fsAsync.writeFile(path, await readBuffer(packFh, offsetSum, size), option)
    else await fsAsync.writeFile(path, '', option)
  }
}
const unpackFsPackDirectory = async (packFh, fsPack, { route }) => {
  const { unpackPath } = fsPack
  const path = resolve(unpackPath, route)
  await createDirectory(path)
}
const unpackFsPackSymlink = async (packFh, fsPack, { route, target }) => {
  const { unpackPath } = fsPack
  const path = resolve(unpackPath, route)
  await createDirectory(dirname(path))
  await fsAsync.symlink(target, path)
}

const collectContentListFromPath = async (inputPath) => {
  const contentList = []
  const directoryPathList = []
  const fileDirectorySet = new Set()
  await walkDirInfoTree(await getDirInfoTree(inputPath), ({ type, path }) => {
    switch (type) {
      case PATH_TYPE.File:
        contentList.push({ type: TYPE_FILE, path })
        fileDirectorySet.add(dirname(path))
        break
      case PATH_TYPE.Directory:
        directoryPathList.push(path)
        break
      case PATH_TYPE.Symlink:
        contentList.push({ type: TYPE_SYMLINK, path })
        fileDirectorySet.add(dirname(path))
        break
      default:
        throw new Error(`unsupported content type: ${type}, from: ${path}`)
    }
  })
  const skipDirectorySet = new Set()
  for (let fileDirectory of fileDirectorySet) {
    let prevFileDirectory = ''
    while (fileDirectory !== prevFileDirectory) {
      skipDirectorySet.add(fileDirectory)
      prevFileDirectory = fileDirectory
      fileDirectory = dirname(fileDirectory)
    }
  }
  for (const path of directoryPathList) if (!skipDirectorySet.has(path)) contentList.push({ type: TYPE_DIRECTORY, path })
  return contentList
}

const resetFastCache = (fsPack) => { fsPack.fastCache = null }
const autoFastCache = (fsPack) => {
  if (fsPack.fastCache) return
  const contentMap = {}
  let offsetSum = fsPack.offset + 2 * UINT32_BYTE_SIZE
  fsPack.headerJSON.contentList.forEach((content) => {
    contentMap[ content.route ] = { content, offsetSum }
    offsetSum += content.size || 0
  })
  fsPack.fastCache = { contentMap, offsetSum }
}

const verifyEdit = (fsPack) => {
  if (fsPack.isReadOnly) throw new Error('no edit readOnly fsPack')
  resetFastCache(fsPack)
}
const verifyUnpack = (fsPack) => {
  if (!fsPack.unpackPath) throw new Error('expect unpackPath')
  autoFastCache(fsPack)
}

const initFsPack = async ({
  packPath, packRoot = dirname(packPath), packFh = null, offset = 0
}) => {
  const fsPack = {
    packPath, packRoot, packFh, offset, isReadOnly: false,
    headerOffset: 2 * UINT32_BYTE_SIZE, headerJSON: { contentList: [] },
    unpackPath: '', fastCache: null
  }
  await autoOpenFsPack(writeFsPackHeader, fsPack, FILE_FLAG_CREATE)
  return fsPack
}

const saveFsPack = async (fsPack) => {
  verifyEdit(fsPack)
  await autoOpenFsPack(writeFsPackHeader, fsPack, FILE_FLAG_EDIT)
}

const loadFsPack = async ({
  packPath, packRoot = dirname(packPath), packFh = null, offset = 0, isReadOnly = false,
  unpackPath = ''
}) => {
  const fsPack = {
    packPath, packRoot, packFh, offset, isReadOnly,
    headerOffset: 0, headerJSON: null,
    unpackPath, fastCache: null
  }
  await autoOpenFsPack(readFsPackHeader, fsPack, isReadOnly ? FILE_FLAG_READ_ONLY : FILE_FLAG_EDIT)
  return fsPack
}

const setFsPackPackRoot = (fsPack, packRoot) => { fsPack.packRoot = packRoot }
const setFsPackUnpackPath = (fsPack, unpackPath) => { fsPack.unpackPath = unpackPath }

const appendFile = async (fsPack, content) => {
  verifyEdit(fsPack)
  await autoOpenFsPack(writeFsPackAppendFile, fsPack, FILE_FLAG_EDIT, content)
}
const appendDirectory = async (fsPack, content) => {
  verifyEdit(fsPack)
  await editFsPackAppendDirectory(fsPack, content)
}
const appendSymlink = async (fsPack, content) => {
  verifyEdit(fsPack)
  await editFsPackAppendSymlink(fsPack, content)
}
const append = async (fsPack, content) => {
  switch (content.type) {
    case TYPE_FILE:
      return appendFile(fsPack, content)
    case TYPE_DIRECTORY:
      return appendDirectory(fsPack, content)
    case TYPE_SYMLINK:
      return appendSymlink(fsPack, content)
    default:
      throw new Error(`invalid content type: ${content.type}`)
  }
}
const appendContentList = async (fsPack, contentList) => {
  verifyEdit(fsPack)
  await autoOpenFsPack(async (packFh, fsPack) => {
    for (const content of contentList) {
      // __DEV__ && console.log(`++ ${content.type} | ${content.route}`)
      switch (content.type) {
        case TYPE_FILE:
          await writeFsPackAppendFile(packFh, fsPack, content)
          break
        case TYPE_DIRECTORY:
          await editFsPackAppendDirectory(fsPack, content)
          break
        case TYPE_SYMLINK:
          await editFsPackAppendSymlink(fsPack, content)
          break
        default:
          throw new Error(`invalid content type: ${content.type}`)
      }
    }
  }, fsPack, FILE_FLAG_EDIT)
}
const appendFromPath = async (fsPack, inputPath) => {
  verifyEdit(fsPack)
  await appendContentList(fsPack, await collectContentListFromPath(inputPath))
}

const unpackFile = async (fsPack, content) => { // TODO: allow get buffer or stream
  verifyUnpack(fsPack)
  await autoOpenFsPack(unpackFsPackFile, fsPack, FILE_FLAG_EDIT, content)
}
const unpackDirectory = async (fsPack, content) => {
  verifyUnpack(fsPack)
  await autoOpenFsPack(unpackFsPackDirectory, fsPack, FILE_FLAG_EDIT, content)
}
const unpackSymlink = async (fsPack, content) => {
  verifyUnpack(fsPack)
  await autoOpenFsPack(unpackFsPackSymlink, fsPack, FILE_FLAG_EDIT, content)
}
const unpack = async (fsPack, content) => {
  switch (content.type) {
    case TYPE_FILE:
      return unpackFile(fsPack, content)
    case TYPE_DIRECTORY:
      return unpackDirectory(fsPack, content)
    case TYPE_SYMLINK:
      return unpackSymlink(fsPack, content)
    default:
      throw new Error(`invalid content type: ${content.type}`)
  }
}
const unpackContentList = async (fsPack, contentList) => {
  verifyUnpack(fsPack)
  await autoOpenFsPack(async (packFh, fsPack) => {
    for (const content of contentList) {
      // __DEV__ && console.log(`-- ${content.type} | ${content.route}`)
      switch (content.type) {
        case TYPE_FILE:
          await unpackFsPackFile(packFh, fsPack, content)
          break
        case TYPE_DIRECTORY:
          await unpackFsPackDirectory(packFh, fsPack, content)
          break
        case TYPE_SYMLINK:
          await unpackFsPackSymlink(packFh, fsPack, content)
          break
        default:
          throw new Error(`invalid content type: ${content.type}`)
      }
    }
  }, fsPack, FILE_FLAG_EDIT)
}
const unpackToPath = async (fsPack, unpackPath) => {
  unpackPath && setFsPackUnpackPath(fsPack, unpackPath)
  await unpackContentList(fsPack, fsPack.headerJSON.contentList)
}

export {
  TYPE_FILE, TYPE_DIRECTORY, TYPE_SYMLINK,
  initFsPack, saveFsPack, loadFsPack,
  setFsPackPackRoot, setFsPackUnpackPath,
  appendFile, appendDirectory, appendSymlink, append, appendContentList, appendFromPath,
  unpackFile, unpackDirectory, unpackSymlink, unpack, unpackContentList, unpackToPath
}
