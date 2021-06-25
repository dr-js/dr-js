import { Preset } from 'source/node/module/Option/preset.js'

const { parseCompact, parseCompactList } = Preset

const AuthCommonFormatConfig = parseCompact('auth-key/SS,O|set for non-default key')
const getAuthCommonOption = ({ tryGetFirst }) => ({
  authKey: tryGetFirst('auth-key')
})

const AuthSkipFormatConfig = parseCompact('auth-skip/T')
const getAuthSkipOption = ({ getToggle }) => ({
  authSkip: getToggle('auth-skip')
})

const AuthFileFormatConfig = parseCompact('auth-file/SP,O')
const getAuthFileOption = ({ tryGetFirst }) => ({
  authFile: tryGetFirst('auth-file')
})

const AuthFileGroupFormatConfig = parseCompact('auth-file-group-path/SP,O', parseCompactList(
  'auth-file-group-default-tag/SS',
  'auth-file-group-key-suffix/SS,O'
))
const getAuthFileGroupOption = ({ tryGetFirst }) => ({
  authFileGroupPath: tryGetFirst('auth-file-group-path'),
  authFileGroupDefaultTag: tryGetFirst('auth-file-group-default-tag'),
  authFileGroupKeySuffix: tryGetFirst('auth-file-group-key-suffix')
})

export {
  AuthCommonFormatConfig, getAuthCommonOption,
  AuthSkipFormatConfig, getAuthSkipOption,
  AuthFileFormatConfig, getAuthFileOption,
  AuthFileGroupFormatConfig, getAuthFileGroupOption
}
