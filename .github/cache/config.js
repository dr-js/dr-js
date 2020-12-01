const { resolve } = require('path')
const { homedir } = require('os')

module.exports = {
  // cacheStep: '', // pass from CLI
  prunePolicy: 'unused',

  pathStatFile: './persist-gitignore/stat',

  pathChecksumList: [ // NOTE: this list of file should decide when the cache content should change, if the cache is npm only, `package-lock.json` should be enough
    // '../../resource/',
    // '../../source/',
    // '../../source-bin/',
    '../../package-lock.json'
  ],
  pathChecksumFile: './temp-gitignore/checksum-file',

  pathStaleCheckList: [
    resolve(homedir(), '.npm/') // NOTE: win32 need to reset cache location

    // NOTE: 'node_modules' is managed, so no stale-check required
    //   choose `npm ci` + cache when no puppeteer
    //   and `npm install` + `node_modules` when there is puppeteer for faster ci
    // './node_modules/'
  ],
  pathStaleCheckFile: './temp-gitignore/stale-check-file',
  maxStaleDay: 8
}
