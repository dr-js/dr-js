import { isString } from 'source/common/check.js'
import { objectFromEntries } from 'source/common/immutable/Object.js'
import { encode as encodeBase64, decode as decodeBase64 } from './Base64.js'

// dataUri format `data:[<mediatype>][;base64],<data>`

/** @typedef { {
 *    value: string | ArrayBuffer,
 *    mime?: string,
 *    paramMap?: {},
 * } } DataUriSource */
/** @type { (option: DataUriSource) => string } */
const encode = ({
  value, // string or ArrayBuffer
  mime, // optional, default to undefined
  paramMap // optional, default to undefined
}) => {
  const isPayloadBase64 = !isString(value)
  // @ts-expect-error
  const payloadString = (isPayloadBase64 ? encodeBase64 : encodeURIComponent)(value)
  const headerString = [
    mime,
    paramMap && String(new URLSearchParams(paramMap)).replace(/&/g, ';'),
    isPayloadBase64 && 'base64'
  ].filter(Boolean).join(';')
  return `data:${headerString},${payloadString}`
}

/** @type { (v: string) => DataUriSource } */
const decode = (string = '') => {
  const payloadIndex = string.indexOf(',')
  const headerStringList = string.slice(__DEV__ ? 'data:'.length : 5, payloadIndex).split(';').filter(Boolean)
  const isPayloadBase64 = headerStringList[ headerStringList.length - 1 ] === 'base64'
  isPayloadBase64 && headerStringList.pop()
  const mime = (headerStringList.length && !headerStringList[ 0 ].includes('=') && headerStringList.shift()) || undefined // mime type do not have `=`
  const paramMap = headerStringList.length === 0 ? undefined
    : objectFromEntries(new URLSearchParams(headerStringList.join('&')).entries())
  const value = (isPayloadBase64 ? decodeBase64 : decodeURIComponent)(string.slice(payloadIndex + 1))
  return { value, mime, paramMap }
}

export {
  encode,
  decode
}
