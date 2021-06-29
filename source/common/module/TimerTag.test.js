import { strictEqual, doThrow } from 'source/common/verify.js'
import { parseTimerTag, packTimerTag, calcDate } from './TimerTag.js'

const { describe, it } = globalThis

describe('Common.Module.TimerTag', () => {
  it('parseTimerTag() & packTimerTag()', () => {
    doThrow(() => parseTimerTag(''), 'should throw on invalid TimerTag')
    doThrow(() => parseTimerTag('0.0.0'), 'should throw on invalid TimerTag')
    doThrow(() => parseTimerTag('@'), 'should throw on invalid TimerTag')
    doThrow(() => parseTimerTag('@YMD'), 'should throw on invalid TimerTag')
    doThrow(() => parseTimerTag('@1D1M'), 'should throw on @tag order')
    doThrow(() => parseTimerTag('@1Y1D'), 'should throw on @tag missing slot')
    doThrow(() => parseTimerTag('@1W1D'), 'should throw on W & YMD conflict')
    doThrow(() => parseTimerTag('@60M1D'), 'should throw on invalid value')
    doThrow(() => parseTimerTag('@0D'), 'should throw on invalid value')
    doThrow(() => parseTimerTag('@1.1D'), 'should throw on invalid value')
    doThrow(() => parseTimerTag('+'), 'should throw on invalid TimerTag')
    doThrow(() => parseTimerTag('+YMD'), 'should throw on invalid TimerTag')

    strictEqual(packTimerTag(parseTimerTag('@5432Y1M1D1h1m1s')), '@5432Y1M1D1h1m1s')
    strictEqual(packTimerTag(parseTimerTag('@   5432Y1M1D   1h1m1s')), '@5432Y1M1D1h1m1s')
    strictEqual(packTimerTag(parseTimerTag('@1W1h1m1s')), '@1W1h1m1s')
    strictEqual(packTimerTag(parseTimerTag('@1W')), '@1W0h0m0s')
    strictEqual(packTimerTag(parseTimerTag('@1M1D1s')), '@1M1D0h0m1s')
    strictEqual(packTimerTag(parseTimerTag('@1D')), '@1D0h0m0s')
    strictEqual(packTimerTag(parseTimerTag('@1h')), '@1h0m0s')
    strictEqual(packTimerTag(parseTimerTag('@1m')), '@1m0s')
    strictEqual(packTimerTag(parseTimerTag('@1s')), '@1s')
    strictEqual(packTimerTag(parseTimerTag('+5432Y1M1W1D1h1m1s')), '+5432Y1M1W1D1h1m1s')
    strictEqual(packTimerTag(parseTimerTag('+1Y1W1m')), '+1Y1W1m')
    strictEqual(packTimerTag(parseTimerTag('+1.1D')), '+1.1D')
    strictEqual(packTimerTag(parseTimerTag('+90m')), '+90m')
  })

  it('calcDate() @tag', () => {
    const refDate = new Date('6543-02-01T12:34:56.000Z')
    const testCalc = (timerTag) => calcDate(parseTimerTag(timerTag), refDate).toISOString()

    doThrow(() => testCalc('@1Y1M1D1h1m1s'), 'should throw on expired TimerTag')
    strictEqual(testCalc('@9999Y1M1D1h1m1s'), '9999-01-01T01:01:01.000Z')

    strictEqual(testCalc('@2M1D12h34m56s'), '6544-02-01T12:34:56.000Z')
    strictEqual(testCalc('@2M1D12h34m57s'), '6543-02-01T12:34:57.000Z')
    strictEqual(testCalc('@2M1D12h34m55s'), '6544-02-01T12:34:55.000Z')
    strictEqual(testCalc('@2M1D'), '6544-02-01T00:00:00.000Z')

    strictEqual(testCalc('@1M1D1h1m1s'), '6544-01-01T01:01:01.000Z')
    strictEqual(testCalc('@1D1h1m1s'), '6543-03-01T01:01:01.000Z')
    strictEqual(testCalc('@1h1m1s'), '6543-02-02T01:01:01.000Z')
    strictEqual(testCalc('@1m1s'), '6543-02-01T13:01:01.000Z')
    strictEqual(testCalc('@1s'), '6543-02-01T12:35:01.000Z')

    strictEqual(testCalc('@1W'), '6543-02-04T00:00:00.000Z')
    strictEqual(testCalc('@2W'), '6543-02-05T00:00:00.000Z')
    strictEqual(testCalc('@3W'), '6543-02-06T00:00:00.000Z')
    strictEqual(testCalc('@4W'), '6543-02-07T00:00:00.000Z')
    strictEqual(testCalc('@5W'), '6543-02-08T00:00:00.000Z')
    strictEqual(testCalc('@6W'), '6543-02-02T00:00:00.000Z')
    strictEqual(testCalc('@7W'), '6543-02-03T00:00:00.000Z')
    strictEqual(testCalc('@5W13h'), '6543-02-01T13:00:00.000Z')

    strictEqual(testCalc('@2M1D'), testCalc('@2M1D0h0m0s'))
    strictEqual(testCalc('@2M1D3m'), testCalc('@2M1D0h3m0s'))
  })

  it('calcDate() +tag', () => {
    const refDate = new Date('1000-01-01T00:00:00.000Z')
    const testCalc = (timerTag) => calcDate(parseTimerTag(timerTag), refDate).toISOString()

    strictEqual(testCalc('+999Y1M1D1h1m1s'), '1998-06-04T01:01:01.000Z')

    strictEqual(testCalc('+1Y'), '1001-01-01T00:00:00.000Z')
    strictEqual(testCalc('+2Y'), '1002-01-01T00:00:00.000Z')
    strictEqual(testCalc('+3Y'), '1003-01-01T00:00:00.000Z')
    strictEqual(testCalc('+4Y'), '1004-01-01T00:00:00.000Z')
    strictEqual(testCalc('+5Y'), '1004-12-31T00:00:00.000Z')

    strictEqual(testCalc('+1M'), '1000-01-31T00:00:00.000Z')
    strictEqual(testCalc('+1W'), '1000-01-08T00:00:00.000Z')
    strictEqual(testCalc('+1D'), '1000-01-02T00:00:00.000Z')
    strictEqual(testCalc('+1h1m1s'), '1000-01-01T01:01:01.000Z')
    strictEqual(testCalc('+1m1s'), '1000-01-01T00:01:01.000Z')

    strictEqual(testCalc('+3600s'), testCalc('+60m'))
    strictEqual(testCalc('+.5h'), testCalc('+30m'))
    strictEqual(testCalc('+1.5W'), testCalc('+1W3D12h'))
  })
})
