import {
  stat, rename, unlink, truncate,
  open, close, read, write, readlink, symlink,
  readFile, writeFile, appendFile, copyFile,
  mkdir, rmdir, readdir,
  createReadStream, createWriteStream,
  access,
  constants as fsConstants
} from 'fs'
import { promisify } from 'util'

const [
  statAsync, renameAsync, unlinkAsync, truncateAsync,
  openAsync, closeAsync, readAsync, writeAsync, readlinkAsync, symlinkAsync,
  readFileAsync, writeFileAsync, appendFileAsync, copyFileAsync,
  mkdirAsync, rmdirAsync, readdirAsync
] = [
  stat, rename, unlink, truncate,
  open, close, read, write, readlink, symlink,
  readFile, writeFile, appendFile, copyFile,
  mkdir, rmdir, readdir
].map((fsFunc) => promisify(fsFunc))

const [
  visibleAsync, readableAsync, writableAsync, executableAsync
] = [
  fsConstants.F_OK,
  fsConstants.R_OK,
  fsConstants.W_OK,
  fsConstants.X_OK
].map((mode) => (path) => new Promise((resolve) => access(path, mode, (error) => resolve(!error))))

export {
  createReadStream, createWriteStream,

  statAsync, renameAsync, unlinkAsync, truncateAsync,
  openAsync, closeAsync, readAsync, writeAsync, readlinkAsync, symlinkAsync,
  readFileAsync, writeFileAsync, appendFileAsync, copyFileAsync,
  mkdirAsync, rmdirAsync, readdirAsync,

  visibleAsync, readableAsync, writableAsync, executableAsync
}
