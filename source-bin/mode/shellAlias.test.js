import {
  doShellAlias
} from './shellAlias.js'

const { describe, it, info = console.log } = globalThis

describe('doShellAlias', () => {
  it('doShellAlias()', () => {
    doShellAlias({
      aliasName: 'GLO16', // npm related command may stall on win32 ci
      aliasArgList: [],
      log: info
    })
  })
})
