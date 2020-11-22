const { resolve } = require('path')
const { homedir } = require('os')

module.exports = {
  // cacheStep: '', // pass from CLI
  prunePolicy: 'unused',

  pathStatFile: './persist-gitignore/stat',

  pathChecksumList: [
    '../../source/',
    '../../source-bin/',
    '../../package-lock.json'
  ],
  pathChecksumFile: './temp-gitignore/checksum-file',

  pathStaleCheckList: [
    resolve(homedir(), '.npm/')
    // node_modules is managed, so no stale-check required
  ],
  pathStaleCheckFile: './temp-gitignore/stale-check-file',
  maxStaleDay: 8
}
