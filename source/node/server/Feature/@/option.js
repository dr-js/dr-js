import { resolve } from 'node:path'
import { isString, isBasicObject } from 'source/common/check.js'
import { indentLineList } from 'source/common/string.js'
import { Preset } from 'source/node/module/Option/preset.js'
import { parseHostString } from 'source/node/server/function.js'

const { parseCompact, parseCompactList } = Preset

const ServerHostFormat = 'host,H/SS,O|set "hostname:port"'
const getServerExotFormatConfig = (extraList = []) => parseCompact(ServerHostFormat, [
  parseCompact(`TLS-SNI-config/SO,O|TLS SNI config map, set to enable https:\n${indentLineList([
    'multi config: { [hostname]: { key: pathOrBuffer, cert: pathOrBuffer, ca: pathOrBuffer } }, default to special hostname "default", or the first config',
    'single config: { key: pathOrBuffer, cert: pathOrBuffer, ca: pathOrBuffer }',
    'key: Private keys in PEM format',
    'cert: Cert chains in PEM format',
    'ca: Optionally override the trusted CA certificates'
  ])}`, parseCompactList(
    'TLS-dhparam/O/1|pathOrBuffer; Diffie-Hellman Key Exchange, generate with: "openssl dhparam -dsaparam -outform PEM -out output/path/dh4096.pem 4096"'
  )),
  ...extraList
])

const getServerExotOption = ({ tryGet, tryGetFirst, pwd }, defaultHostname = '127.0.0.1') => {
  const { hostname, port } = parseHostString(tryGetFirst('host') || '', defaultHostname)
  const pwdTLSSNIConfig = pwd('TLS-SNI-config') // should be the same for `TLS-dhparam`
  return {
    protocol: pwdTLSSNIConfig ? 'https:' : 'http:', hostname, port,
    ...(pwdTLSSNIConfig && objectMapDeep({
      TLSSNIConfig: tryGetFirst('TLS-SNI-config'),
      TLSDHParam: tryGetFirst('TLS-dhparam')
    }, (value) => isString(value) ? resolve(pwdTLSSNIConfig, value) : value))
  }
}
const objectMapDeep = (object, mapFunc) => {
  const result = {}
  for (const [ key, value ] of Object.entries(object)) result[ key ] = (isBasicObject(value) && !Buffer.isBuffer(value)) ? objectMapDeep(value, mapFunc) : mapFunc(value, key)
  return result
}

const LogFormatConfig = parseCompact('log-path/SP,O', parseCompactList(
  'log-file-prefix/SS,O'
))
const getLogOption = ({ tryGetFirst }) => ({
  pathLogDirectory: tryGetFirst('log-path'),
  logFilePrefix: tryGetFirst('log-file-prefix')
})

const PidFormatConfig = parseCompact('pid-file/SP,O', parseCompactList(
  'pid-ignore-exist/T'
))
const getPidOption = ({ tryGetFirst, getToggle }) => ({
  filePid: tryGetFirst('pid-file'),
  shouldIgnoreExistPid: getToggle('pid-ignore-exist')
})

export {
  ServerHostFormat, getServerExotFormatConfig, getServerExotOption,

  LogFormatConfig, getLogOption,
  PidFormatConfig, getPidOption
}
