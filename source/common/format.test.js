import { strictEqual } from 'source/common/verify'
import {
  describe as describeFormat,
  percent,
  mediaTime,
  decimal,
  time,
  binary
  // padTable,
  // prettyStringifyJSON
} from './format'

const { describe, it } = global

describe('Common.Format', () => {
  it('describe()', () => {
    strictEqual(describeFormat(), `<undefined> undefined`)
    strictEqual(describeFormat(0), `<number> 0`)
    strictEqual(describeFormat(NaN), `<number> null`)
    strictEqual(describeFormat(Infinity), `<number> null`)
    strictEqual(describeFormat(null), `<object> null`)
    strictEqual(describeFormat(undefined), `<undefined> undefined`)
    strictEqual(describeFormat({}), `<object> {}`)
    strictEqual(describeFormat([]), `<object> []`)
    strictEqual(describeFormat([ {} ]), `<object> [{}]`)
    strictEqual(describeFormat({ '': [] }), `<object> {"":[]}`)
    strictEqual(describeFormat(() => {}), `<function> ()=>{...}`)
    strictEqual(describeFormat(function () {}), `<function> ()=>{...}`)

    const loop = {}
    loop.loop = loop
    strictEqual(describeFormat(loop), `<object> {...}`)
  })

  it('percent()', () => {
    strictEqual(percent(), `NaN%`)
    strictEqual(percent(0), `0.00%`)
    strictEqual(percent(1), `100.00%`)
    strictEqual(percent(0.5), `50.00%`)
    strictEqual(percent(-1), `-100.00%`)
    strictEqual(percent(-0.001), `-0.10%`)
    strictEqual(percent(2), `200.00%`)
    strictEqual(percent(10000), `1000000.00%`)
  })

  it('mediaTime()', () => {
    strictEqual(mediaTime(), `NaN:NaN`)
    strictEqual(mediaTime(0), `00:00`)
    strictEqual(mediaTime(0.1), `00:00`)
    strictEqual(mediaTime(0.9), `00:00`)
    strictEqual(mediaTime(1), `00:01`)
    strictEqual(mediaTime(60), `01:00`)
    strictEqual(mediaTime(60 * 60), `60:00`)
    strictEqual(mediaTime(-1), `-00:01`)
    strictEqual(mediaTime(-60), `-01:00`)
    strictEqual(mediaTime(-60 * 60), `-60:00`)
  })

  it('decimal()', () => {
    strictEqual(decimal(), `NaNexa`)
    strictEqual(decimal(0), `0`)
    strictEqual(decimal(0.1), `100.00milli`)
    strictEqual(decimal(0.00001), `10.00micro`)
    strictEqual(decimal(100), `100.00`)
    strictEqual(decimal(100000), `100.00kilo`)
    strictEqual(decimal(100000000), `100.00mega`)
    strictEqual(decimal(Number.MAX_VALUE), `1.7976931348623157e+290exa`)
    strictEqual(decimal(Number.MAX_SAFE_INTEGER), `9.01peta`)
    strictEqual(decimal(Number.MIN_VALUE), `0.00pico`)
    strictEqual(decimal(Number.MIN_SAFE_INTEGER), `-9.01peta`)
    strictEqual(decimal(Number.EPSILON), `0.00pico`)
    strictEqual(decimal(-0.1), `-100.00milli`)
    strictEqual(decimal(-0.00001), `-10.00micro`)
    strictEqual(decimal(-100), `-100.00`)
    strictEqual(decimal(-100000), `-100.00kilo`)
    strictEqual(decimal(-100000000), `-100.00mega`)
    strictEqual(decimal(-Number.MAX_VALUE), `-1.7976931348623157e+290exa`)
    strictEqual(decimal(-Number.MAX_SAFE_INTEGER), `-9.01peta`)
    strictEqual(decimal(-Number.MIN_VALUE), `-0.00pico`)
    strictEqual(decimal(-Number.MIN_SAFE_INTEGER), `9.01peta`)
    strictEqual(decimal(-Number.EPSILON), `-0.00pico`)
  })

  it('time()', () => {
    strictEqual(time(), `NaNd`)
    strictEqual(time(0), `0ms`)
    strictEqual(time(0.1), `0ms`)
    strictEqual(time(0.00001), `0ms`)
    strictEqual(time(100), `100ms`)
    strictEqual(time(100000), `1.67m`)
    strictEqual(time(100000000), `27.78h`)
    strictEqual(time(Number.MAX_SAFE_INTEGER), `104249991.37d`)
    strictEqual(time(-0.1), `-1ms`)
    strictEqual(time(-0.00001), `-1ms`)
    strictEqual(time(-100), `-100ms`)
    strictEqual(time(-100000), `-1.67m`)
    strictEqual(time(-100000000), `-27.78h`)
    strictEqual(time(-Number.MAX_SAFE_INTEGER), `-104249991.37d`)
  })

  it('binary()', () => {
    strictEqual(binary(), `NaNTi`)
    strictEqual(binary(0), `0`)
    strictEqual(binary(0.1), `0`)
    strictEqual(binary(0.00001), `0`)
    strictEqual(binary(100), `100`)
    strictEqual(binary(100000), `97.66Ki`)
    strictEqual(binary(100000000), `95.37Mi`)
    strictEqual(binary(100000000000), `93.13Gi`)
    strictEqual(binary(Number.MAX_SAFE_INTEGER), `8192.00Ti`)
    strictEqual(binary(-0.1), `-1`)
    strictEqual(binary(-0.00001), `-1`)
    strictEqual(binary(-100), `-100`)
    strictEqual(binary(-100000), `-97.66Ki`)
    strictEqual(binary(-100000000), `-95.37Mi`)
    strictEqual(binary(-100000000000), `-93.13Gi`)
    strictEqual(binary(-Number.MAX_SAFE_INTEGER), `-8192.00Ti`)
  })
})
