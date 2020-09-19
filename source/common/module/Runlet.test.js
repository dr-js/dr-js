import { strictEqual, stringifyEqual } from 'source/common/verify'
import { createInsideOutPromise } from 'source/common/function'
import { compareStringWithNumber } from 'source/common/compare'
import { setTimeoutAsync, createStepper } from 'source/common/time'
import { catchPromise } from 'source/common/error'
import { time } from 'source/common/format'
import { getSample, getSampleRange } from 'source/common/math/sample'
import {
  END, SKIP, REDO,
  createPack, // clearPack, describePack,
  createRunlet,
  createCountPool, KEY_POOL_IO, KEY_PEND_INPUT, KEY_PEND_OUTPUT, PoolIO, TYPE_LOGICAL_PENDVIEW, TYPE_LOGICAL_PENDVIEWEE, createLogicalCountPool,
  ChipSyncBasic, createArrayInputChip, createArrayOutputChip, createAsyncIteratorInputChip, createAsyncIteratorOutputChip, createENDRegulatorChip,
  toPoolMap, toChipMap, toLinearChipList, quickConfigPend
} from './Runlet'

const { describe, it, info = console.log } = global

describe('Common.Module.Runlet', () => {
  const poolKey = 'default'

  // Sync mode will rerun same Chip till Pool is full, then rerun next Chip, and then start over,
  //   this will produce a wake miss count around `chipCount * packCount / #poolSizeLimit`,
  //   so it maybe better to assign sync Runlet bigger poolSizeLimit for less wake miss.
  // Async mode will run all runnable Chip at once, and usually give less pressure on the wakeLoop,
  //   and when all Chip is around the same speed, there'll be almost none wake miss.
  const benchPoolSizeLimit = 8
  const benchValueList = getSampleRange(1, 2 ** 18)
  it('createRunlet() active, sync bench', async () => {
    const { promise, resolve, reject } = createInsideOutPromise()
    let isEND = false

    const poolMap = toPoolMap([
      PoolIO,
      createCountPool({ key: poolKey, sizeLimit: benchPoolSizeLimit })
    ])
    const chipMap = toChipMap(toLinearChipList([
      {
        prevPoolKey: KEY_POOL_IO, prevPendKey: KEY_PEND_INPUT,
        state: { index: 0 }, sync: true, process: (pack, state, error) => {
          if (error) return
          if (benchValueList.length === state.index) pack[ 1 ] = END
          else {
            pack[ 0 ] = benchValueList[ state.index ]
            pack[ 1 ] = undefined
            state.index++
          }
          return { pack, state }
        }
      },
      { sync: true, process: (pack, state, error) => error ? undefined : { pack, state } },
      { sync: true, process: (pack, state, error) => error ? undefined : { pack, state } },
      {
        nextPoolKey: KEY_POOL_IO, nextPendKey: KEY_PEND_OUTPUT,
        state: { index: 0 }, sync: true, process: (pack, state, error) => {
          if (error) return reject(error)
          if (pack[ 1 ] === END) {
            isEND = true
            resolve(state.index)
          } else {
            pack[ 0 ] = undefined
            pack[ 1 ] = SKIP
            state.index++
          }
          return { pack, state }
        }
      }
    ]))

    const { attach, trigger, describe } = createRunlet(quickConfigPend(poolMap, chipMap))
    attach()
    const stepper = createStepper()
    trigger()
    info(`done: ${time(stepper())}`)
    strictEqual(isEND, true, 'should end now when all Chip is sync')
    const result = await promise
    __DEV__ && console.log(result)
    __DEV__ && info('==== runlet.describe ====')
    __DEV__ && info(describe().join('\n'))
    stringifyEqual(result, benchValueList.length)
  })

  it('createRunlet() active, async bench', async () => {
    const { promise, resolve, reject } = createInsideOutPromise()

    const poolMap = toPoolMap([
      PoolIO,
      createCountPool({ key: poolKey, sizeLimit: benchPoolSizeLimit })
    ])
    const chipMap = toChipMap(toLinearChipList([
      {
        prevPoolKey: KEY_POOL_IO, prevPendKey: KEY_PEND_INPUT,
        state: { index: 0 }, process: async (pack, state, error) => {
          if (error) return
          if (benchValueList.length === state.index) pack[ 1 ] = END
          else {
            pack[ 0 ] = benchValueList[ state.index ]
            pack[ 1 ] = undefined
            state.index++
          }
          return { pack, state }
        }
      },
      { process: async (pack, state, error) => error ? undefined : { pack, state } },
      { process: async (pack, state, error) => error ? undefined : { pack, state } },
      {
        nextPoolKey: KEY_POOL_IO, nextPendKey: KEY_PEND_OUTPUT,
        state: { index: 0 }, process: async (pack, state, error) => {
          if (error) return reject(error)
          if (pack[ 1 ] === END) resolve(state.index)
          else {
            pack[ 0 ] = undefined
            pack[ 1 ] = SKIP
            state.index++
          }
          return { pack, state }
        }
      }
    ]))

    const { attach, trigger, describe } = createRunlet(quickConfigPend(poolMap, chipMap))
    attach()
    const stepper = createStepper()
    trigger()

    const result = await promise
    info(`done: ${time(stepper())}`)
    __DEV__ && console.log(result)
    __DEV__ && info('==== runlet.describe ====')
    __DEV__ && info(describe().join('\n'))
    stringifyEqual(result, benchValueList.length)
  })

  const samplePoolSizeLimit = 8
  const sampleSourceCount = 32

  it('createRunlet() active, basic, minimal helper sample', async () => {
    const poolMap = toPoolMap([
      PoolIO,
      createCountPool({ key: poolKey, sizeLimit: samplePoolSizeLimit })
    ])
    const chipMap = toChipMap([
      createArrayInputChip({ nextPoolKey: poolKey, nextPendKey: 'pend:a', array: getSampleRange(1, sampleSourceCount) }),
      { ...ChipSyncBasic, prevPoolKey: poolKey, prevPendKey: 'pend:a', nextPoolKey: poolKey, nextPendKey: 'pend:b' },
      createArrayOutputChip({ key: 'out', prevPoolKey: poolKey, prevPendKey: 'pend:b' })
    ])

    const { attach, trigger, describe } = createRunlet(quickConfigPend(poolMap, chipMap))
    attach()
    trigger()

    const result = await chipMap.get('out').promise
    __DEV__ && console.log(result)
    __DEV__ && info('==== runlet.describe ====')
    __DEV__ && info(describe().join('\n'))
    stringifyEqual(result, getSampleRange(1, sampleSourceCount))
  })

  it('createRunlet() active, basic, minimal helper iterable', async () => {
    const poolMap = toPoolMap([
      PoolIO,
      createCountPool({ key: poolKey, sizeLimit: samplePoolSizeLimit })
    ])
    const chipMap = toChipMap([
      createAsyncIteratorInputChip({ nextPoolKey: poolKey, nextPendKey: 'pend:a', iterable: getSampleRange(1, sampleSourceCount) }),
      { ...ChipSyncBasic, prevPoolKey: poolKey, prevPendKey: 'pend:a', nextPoolKey: poolKey, nextPendKey: 'pend:b' },
      createAsyncIteratorOutputChip({ key: 'out', prevPoolKey: poolKey, prevPendKey: 'pend:b' })
    ])

    const { attach, trigger, describe } = createRunlet(quickConfigPend(poolMap, chipMap))
    attach()
    trigger()

    const result = []
    for await (const value of chipMap.get('out')) result.push(value)
    __DEV__ && console.log(result)
    __DEV__ && info('==== runlet.describe ====')
    __DEV__ && info(describe().join('\n'))
    stringifyEqual(result, getSampleRange(1, sampleSourceCount))
  })

  it('createRunlet() active, basic', async () => {
    const poolMap = toPoolMap([
      PoolIO,
      createCountPool({ key: poolKey, sizeLimit: samplePoolSizeLimit })
    ])
    const chipMap = toChipMap(toLinearChipList([
      createArrayInputChip({ array: getSampleRange(1, sampleSourceCount) }),
      { sync: true, process: (pack, state, error) => (error ? undefined : { pack, state }) },
      createArrayOutputChip({ key: 'out' })
    ], { poolKey }))

    const { attach, trigger, describe } = createRunlet(quickConfigPend(poolMap, chipMap))
    attach()
    trigger()

    const result = await chipMap.get('out').promise
    __DEV__ && console.log(result)
    __DEV__ && info('==== runlet.describe ====')
    __DEV__ && info(describe().join('\n'))
    stringifyEqual(result, getSampleRange(1, sampleSourceCount))
  })

  it('createRunlet() active, pause & re-trigger', async () => {
    const poolMap = toPoolMap([
      PoolIO,
      createCountPool({ sizeLimit: samplePoolSizeLimit })
    ])
    const chipMap = toChipMap(toLinearChipList([
      delayChipProcess(createArrayInputChip({ array: getSampleRange(1, sampleSourceCount) }), 2),
      { sync: true, process: (pack, state, error) => (error ? undefined : { pack, state }) },
      createArrayOutputChip({ key: 'out' })
    ]))

    const { attach, trigger, pause, resume, describe } = createRunlet(quickConfigPend(poolMap, chipMap))
    attach()
    trigger()
    await setTimeoutAsync(10)
    __DEV__ && info('==== runlet.describe ====')
    __DEV__ && info(describe().join('\n'))
    pause()
    await setTimeoutAsync(10)
    __DEV__ && info('==== runlet.describe ====')
    __DEV__ && info(describe().join('\n'))
    resume()
    trigger()

    const result = await chipMap.get('out').promise
    __DEV__ && console.log(result)
    __DEV__ && info('==== runlet.describe ====')
    __DEV__ && info(describe().join('\n'))
    stringifyEqual(result, getSampleRange(1, sampleSourceCount))
  })

  it('createRunlet() active, detach', async () => {
    const IOP = createInsideOutPromise()

    const poolMap = toPoolMap([
      PoolIO,
      createCountPool({ sizeLimit: samplePoolSizeLimit })
    ])
    const chipMap = toChipMap(toLinearChipList([
      delayChipProcess(createArrayInputChip({ array: getSampleRange(1, sampleSourceCount) }), 2),
      { sync: true, process: (pack, state, error) => (error ? undefined : { pack, state }) },
      createArrayOutputChip({ IOP })
    ]))

    const { attach, trigger, detach, getIsValid, describe } = createRunlet(quickConfigPend(poolMap, chipMap))
    attach()
    trigger()
    await setTimeoutAsync(10)

    strictEqual(getIsValid(), true)
    const detachedData = detach()
    __DEV__ && console.log(detachedData)
    strictEqual(getIsValid(), false)

    await setTimeoutAsync(6) // wait remaining process to finish
    const describeDetach0 = describe()
    await setTimeoutAsync(10) // make sure no new process starts
    const describeDetach1 = describe()
    stringifyEqual(describeDetach0, describeDetach1, 'runlet state should not update after detach')

    IOP.resolve('noop')
    const result = await IOP.promise // runlet should not reach the end
    strictEqual(result, 'noop')

    __DEV__ && info('==== runlet.describe ====')
    __DEV__ && info(describe().join('\n'))
  })

  it('createRunlet() active, test error from middle chip', async () => { // TODO: test error from both end chip?
    const IOP = createInsideOutPromise()

    const bombError = new Error('BOOM')

    const poolMap = toPoolMap([
      PoolIO,
      createCountPool({ sizeLimit: samplePoolSizeLimit })
    ])
    const chipMap = toChipMap(toLinearChipList([
      delayChipProcess(createArrayInputChip({ array: getSampleRange(1, sampleSourceCount) }), 1),
      {
        state: { turnLeft: 3 },
        sync: true, process: (pack, state, error) => {
          if (error) return
          state.turnLeft--
          if (state.turnLeft === 0) throw bombError
          return { pack, state }
        }
      },
      createArrayOutputChip({ IOP }) // should error
    ]))

    const { attach, trigger, detach, getIsValid, describe } = createRunlet(quickConfigPend(poolMap, chipMap))
    attach()
    trigger()
    __DEV__ && info('==== runlet.describe ====')
    __DEV__ && info(describe().join('\n'))

    strictEqual(getIsValid(), true)

    const { result, error } = await catchPromise(IOP.promise) // runlet should not reach the end
    strictEqual(result, undefined)
    strictEqual(error, bombError)
    strictEqual(getIsValid(), false)

    // now you can still detach and examine the "mess"
    const detachedData = detach()
    __DEV__ && console.log(detachedData)

    await setTimeoutAsync(10)
    __DEV__ && info('==== runlet.describe ====')
    __DEV__ && info(describe().join('\n'))
  })

  it('createRunlet() active, 1:n ratio', async () => {
    const poolMap = toPoolMap([
      PoolIO,
      createCountPool({ sizeLimit: samplePoolSizeLimit })
    ])
    const chipMap = toChipMap(toLinearChipList([
      createArrayInputChip({ array: getSampleRange(1, 16) }),
      createSample1toNChip({ splitCount: 5 }),
      createArrayOutputChip({ key: 'out' })
    ]))

    const { attach, trigger } = createRunlet(quickConfigPend(poolMap, chipMap))
    attach()
    trigger()

    const result = await chipMap.get('out').promise
    __DEV__ && console.log(result)
    stringifyEqual(result, [
      '1[1/5]', '1[2/5]', '1[3/5]', '1[4/5]', '1[5/5]',
      '2[1/5]', '2[2/5]', '2[3/5]', '2[4/5]', '2[5/5]',
      '3[1/5]', '3[2/5]', '3[3/5]', '3[4/5]', '3[5/5]',
      '4[1/5]', '4[2/5]', '4[3/5]', '4[4/5]', '4[5/5]',
      '5[1/5]', '5[2/5]', '5[3/5]', '5[4/5]', '5[5/5]',
      '6[1/5]', '6[2/5]', '6[3/5]', '6[4/5]', '6[5/5]',
      '7[1/5]', '7[2/5]', '7[3/5]', '7[4/5]', '7[5/5]',
      '8[1/5]', '8[2/5]', '8[3/5]', '8[4/5]', '8[5/5]',
      '9[1/5]', '9[2/5]', '9[3/5]', '9[4/5]', '9[5/5]',
      '10[1/5]', '10[2/5]', '10[3/5]', '10[4/5]', '10[5/5]',
      '11[1/5]', '11[2/5]', '11[3/5]', '11[4/5]', '11[5/5]',
      '12[1/5]', '12[2/5]', '12[3/5]', '12[4/5]', '12[5/5]',
      '13[1/5]', '13[2/5]', '13[3/5]', '13[4/5]', '13[5/5]',
      '14[1/5]', '14[2/5]', '14[3/5]', '14[4/5]', '14[5/5]',
      '15[1/5]', '15[2/5]', '15[3/5]', '15[4/5]', '15[5/5]',
      '16[1/5]', '16[2/5]', '16[3/5]', '16[4/5]', '16[5/5]'
    ])
  })

  it('createRunlet() active, n:1 ratio', async () => {
    const poolMap = toPoolMap([
      PoolIO,
      createCountPool({ sizeLimit: samplePoolSizeLimit })
    ])
    const chipMap = toChipMap(toLinearChipList([
      createArrayInputChip({ array: getSampleRange(1, 16) }),
      createSampleNto1Chip({ mergeCount: 5 }),
      createArrayOutputChip({ key: 'out' })
    ]))

    const { attach, trigger } = createRunlet(quickConfigPend(poolMap, chipMap))
    attach()
    trigger()

    const result = await chipMap.get('out').promise
    __DEV__ && console.log(result)
    stringifyEqual(result, [
      '1,2,3,4,5 [5/5]',
      '6,7,8,9,10 [5/5]',
      '11,12,13,14,15 [5/5]',
      '16 [1/5]'
    ])
  })

  it('createRunlet() active, test if mix random-split with REDO will cause dup/missing value', async () => {
    const poolMap = toPoolMap([
      PoolIO,
      createCountPool({ sizeLimit: samplePoolSizeLimit })
    ])
    const chipMap = toChipMap(toLinearChipList([
      createArrayInputChip({ array: getSampleRange(1, 16) }),
      createENDRegulatorChip({ outputChipCount: 3, nextPendKey: 'pend:mix-in', key: 'chip:reg0' }),

      // random-split and REDO (pull from same Pend, and REDO many time, should output out-of-order value, but no dup/missing)
      delayChipProcess(createSample1toNChip({ splitCount: 5, prevPendKey: 'pend:mix-in', nextPendKey: 'pend:mix-out', key: 'chip:mix0' }), 3),
      delayChipProcess(createSample1toNChip({ splitCount: 5, prevPendKey: 'pend:mix-in', nextPendKey: 'pend:mix-out', key: 'chip:mix1' }), 2),
      delayChipProcess(createSample1toNChip({ splitCount: 5, prevPendKey: 'pend:mix-in', nextPendKey: 'pend:mix-out', key: 'chip:mix2' }), 1),

      createENDRegulatorChip({ inputChipCount: 3, prevPendKey: 'pend:mix-out', key: 'chip:reg1' }),
      createArrayOutputChip({ key: 'out' })
    ]))

    const { attach, trigger, describe } = createRunlet(quickConfigPend(poolMap, chipMap))
    attach()
    trigger()

    const result = await chipMap.get('out').promise
    __DEV__ && info('==== runlet.describe ====')
    __DEV__ && info(describe().join('\n'))
    __DEV__ && console.log(result)
    stringifyEqual(result.sort(compareStringWithNumber), [ // NOTE: the order can change, so sort is needed
      '1[1/5]', '1[2/5]', '1[3/5]', '1[4/5]', '1[5/5]',
      '2[1/5]', '2[2/5]', '2[3/5]', '2[4/5]', '2[5/5]',
      '3[1/5]', '3[2/5]', '3[3/5]', '3[4/5]', '3[5/5]',
      '4[1/5]', '4[2/5]', '4[3/5]', '4[4/5]', '4[5/5]',
      '5[1/5]', '5[2/5]', '5[3/5]', '5[4/5]', '5[5/5]',
      '6[1/5]', '6[2/5]', '6[3/5]', '6[4/5]', '6[5/5]',
      '7[1/5]', '7[2/5]', '7[3/5]', '7[4/5]', '7[5/5]',
      '8[1/5]', '8[2/5]', '8[3/5]', '8[4/5]', '8[5/5]',
      '9[1/5]', '9[2/5]', '9[3/5]', '9[4/5]', '9[5/5]',
      '10[1/5]', '10[2/5]', '10[3/5]', '10[4/5]', '10[5/5]',
      '11[1/5]', '11[2/5]', '11[3/5]', '11[4/5]', '11[5/5]',
      '12[1/5]', '12[2/5]', '12[3/5]', '12[4/5]', '12[5/5]',
      '13[1/5]', '13[2/5]', '13[3/5]', '13[4/5]', '13[5/5]',
      '14[1/5]', '14[2/5]', '14[3/5]', '14[4/5]', '14[5/5]',
      '15[1/5]', '15[2/5]', '15[3/5]', '15[4/5]', '15[5/5]',
      '16[1/5]', '16[2/5]', '16[3/5]', '16[4/5]', '16[5/5]'
    ])
  })

  it('createRunlet() passive, basic', async () => {
    const poolMap = toPoolMap([
      createCountPool({ sizeLimit: samplePoolSizeLimit })
    ])
    const chipMap = toChipMap(toLinearChipList([
      createSample1toNChip({ splitCount: 3, prevPendKey: 'pend:in' }),
      createSampleNto1Chip({ mergeCount: 2, nextPendKey: 'pend:out' })
    ]))

    const { attach, trigger, createPendInput, createPendOutput, describe } = createRunlet(quickConfigPend(poolMap, chipMap))
    attach()
    trigger() // will do nothing

    const pendInput = createPendInput(poolKey, 'pend:in')
    const pendOutput = createPendOutput(poolKey, 'pend:out')
    strictEqual(pendInput.canPush(), true)
    strictEqual(pendOutput.canPull(), false)

    pendInput.push(createPack(1, undefined))
    __DEV__ && info('==== runlet.describe ====')
    __DEV__ && info(describe().join('\n'))

    strictEqual(pendOutput.pull(), undefined) // nothing yet
    while (!pendOutput.canPull()) await setTimeoutAsync(1) // wait & keep polling
    stringifyEqual(pendOutput.pull(), [ '1[1/3],1[2/3] [2/2]', undefined, undefined ])

    pendInput.push(createPack(undefined, END))

    while (!pendOutput.canPull()) await setTimeoutAsync(1) // wait & keep polling
    stringifyEqual(pendOutput.pull(), [ '1[3/3] [1/2]', undefined, undefined ])
    stringifyEqual(pendOutput.pull(), [ undefined, END, undefined ]) // should flush value & END out
    __DEV__ && info('==== runlet.describe ====')
    __DEV__ && info(describe().join('\n'))
  })

  // ## ThePlan ##
  //   <Total 10D=30A+30C=30A+15B>
  //   <PoolLimit 5pcs>
  //   In 3A/s   || In 1B/s
  //      pass   || Trans 2C=1B/2s
  //   MergeTrans 1D=3A+3C/s
  //   Out 1D/5s || Out 1D/4s

  it('createRunlet() active, less messy setup', async () => {
    const endIOP0 = createInsideOutPromise()
    const endIOP1 = createInsideOutPromise()

    const poolKeyLogical = 'pool:logical'
    const pool = createCountPool({ key: poolKey, sizeLimit: 5 })
    const poolMap = toPoolMap([
      PoolIO,
      pool,
      createLogicalCountPool({ key: poolKeyLogical, innerPool: pool })
    ])

    const pendLogicAC = { // repack 1A+1C as single pack, pull only, no push/REDO
      type: TYPE_LOGICAL_PENDVIEW, pendVieweeKeyList: [ 'pend:logical-out-A', 'pend:logical-out-C' ],
      isPendLimitedUnbind: (innerPool, pendLogicalMap, pendLogic, pendKey) => true,
      getPendSizeUnbind: (innerPool, pendLogicalMap, pendLogic, pendKey) => Math.min(innerPool.getPendSize('pend:logical-out-A'), innerPool.getPendSize('pend:logical-out-C')),
      pushPendUnbind: (innerPool, pendLogicalMap, pendLogic, pendKey, pack) => { throw new Error('no pushPend for pendLogicAC') },
      pullPendUnbind: (innerPool, pendLogicalMap, pendLogic, pendKey) => {
        if (Math.min(innerPool.getPendSize('pend:logical-out-A'), innerPool.getPendSize('pend:logical-out-C')) === 0) return
        const packA = innerPool.pullPend('pend:logical-out-A')
        const packC = innerPool.pullPend('pend:logical-out-C')
        return createPack({ packA, packC }, undefined)
      },
      describe: () => 'pack=1A+1C'
    }
    const chipMap = toChipMap([
      delayChipProcess(createArrayInputChip({
        key: 'chip:input-A', nextPoolKey: poolKeyLogical, nextPendKey: 'pend:logical-out-A', nextPendLogic: { type: TYPE_LOGICAL_PENDVIEWEE },
        array: getSample((index) => ({ type: 'A', index }), 30)
      }), 12),
      delayChipProcess(createArrayInputChip({ key: 'chip:input-B', nextPoolKey: poolKey, nextPendKey: 'pend:out-B', array: getSample((index) => ({ type: 'B', index }), 15) }), 4),
      delayChipProcess(createSample1toNChip({
        key: 'chip:trans-B-C', prevPoolKey: poolKey, prevPendKey: 'pend:out-B', nextPoolKey: poolKeyLogical, nextPendKey: 'pend:logical-out-C', nextPendLogic: { type: TYPE_LOGICAL_PENDVIEWEE },
        splitCount: 2, splitValue: async (value, index, indexMax) => ({ type: 'C', index: (value.index + index * 0.01) })
      }), 8),
      {
        key: 'chip:merge-trans-A-C', prevPoolKey: poolKeyLogical, prevPendKey: 'pend:logical-in-A-C', prevPendLogic: pendLogicAC, nextPoolKey: poolKey, nextPendKey: 'pend:out-D',
        state: { AList: [], CList: [] },
        process: async (pack, state, error) => {
          if (error) return
          if (pack[ 1 ] === END) throw new Error('should not get END here') // return { pack, state } // should not happen here
          const { packA, packC } = pack[ 0 ]
          if (packA[ 1 ] === END || packC[ 1 ] === END) {
            if (packA[ 1 ] !== packC[ 1 ]) throw new Error('should END at same time')
            if (state.AList.length !== 0 || state.CList.length !== 0) throw new Error('should END and empty')
            return { pack: createPack(undefined, END), state }
          }
          state.AList.push(packA[ 0 ])
          state.CList.push(packC[ 0 ])
          if (state.AList.length < 3) return { pack: createPack(undefined, SKIP), state }
          const valueD = { type: 'D', content: [ ...state.AList, ...state.CList ] }
          state.AList.length = state.CList.length = 0
          return { pack: createPack(valueD, undefined), state }
        }
      },
      createENDRegulatorChip({ outputChipCount: 2, prevPoolKey: poolKey, prevPendKey: 'pend:out-D', nextPoolKey: poolKey, nextPendKey: 'pend:out-D-2' }),
      delayChipProcess(createArrayOutputChip({ key: 'chip:out-D-0', prevPoolKey: poolKey, prevPendKey: 'pend:out-D-2', IOP: endIOP0 }), 20),
      delayChipProcess(createArrayOutputChip({ key: 'chip:out-D-1', prevPoolKey: poolKey, prevPendKey: 'pend:out-D-2', IOP: endIOP1 }), 16)
    ])

    const { attach, trigger, describe } = createRunlet(quickConfigPend(poolMap, chipMap))
    attach()
    trigger()
    __DEV__ && info('==== runlet.describe ====')
    __DEV__ && info(describe().join('\n'))

    const [ result0, result1 ] = await Promise.all([ endIOP0.promise, endIOP1.promise ])
    __DEV__ && console.log('result0', JSON.stringify(result0))
    __DEV__ && console.log('result1', JSON.stringify(result1))
    strictEqual(result0.length + result1.length, 10)
    strictEqual(result0.length > 0, true)
    strictEqual(result1.length > 0, true)

    await setTimeoutAsync(1)
    __DEV__ && info('==== runlet.describe ====')
    __DEV__ && info(describe().join('\n'))
  })

  it('createRunlet() active, sort of messy setup', async () => {
    const endIOP0 = createInsideOutPromise()
    const endIOP1 = createInsideOutPromise()

    const poolMap = toPoolMap([
      PoolIO,
      createCountPool({ key: poolKey, sizeLimit: 5 })
    ])

    const chipMap = toChipMap([
      delayChipProcess(createArrayInputChip({ key: 'chip:input-B', nextPoolKey: poolKey, nextPendKey: 'pend:out-B', array: getSample((index) => ({ type: 'B', index }), 15) }), 4),
      delayChipProcess(createSample1toNChip({
        key: 'chip:trans-B-C', prevPoolKey: poolKey, prevPendKey: 'pend:out-B', nextPoolKey: poolKey, nextPendKey: 'pend:out-C',
        splitCount: 2, splitValue: async (value, index, indexMax) => ({ type: 'C', index: (value.index + index * 0.01) })
      }), 8),
      createAsyncIteratorOutputChip({ key: 'chip:out-C', prevPoolKey: poolKey, prevPendKey: 'pend:out-C' }), // jump wire
      delayChipProcess(createArrayInputChip({
        key: 'chip:input-A', nextPoolKey: poolKey, nextPendKey: 'pend:out-A',
        array: getSample((index) => ({ type: 'A', index }), 30)
      }), 12),
      {
        key: 'chip:merge-trans-A-C', prevPoolKey: poolKey, prevPendKey: 'pend:out-A', nextPoolKey: poolKey, nextPendKey: 'pend:out-D',
        state: { AList: [], CList: [] },
        process: async (pack, state, error) => {
          if (error) return
          if (pack[ 1 ] === END) { // do not flush remain A/C, but try drain C
            if (!(await chipOutC.next()).done) throw new Error('unexpected C state')
            return { pack, state }
          }
          state.AList.push(pack[ 0 ])
          if (state.AList.length < 3) return { pack: createPack(undefined, SKIP), state } // get more A
          while (state.CList.length < 3) {
            const { value, done } = await chipOutC.next()
            if (done) throw new Error('unexpected C END')
            state.CList.push(value)
          }
          const valueD = { type: 'D', content: [ ...state.AList, ...state.CList ] }
          state.AList.length = state.CList.length = 0
          return { pack: createPack(valueD, undefined), state }
        }
      },
      createENDRegulatorChip({ outputChipCount: 2, prevPoolKey: poolKey, prevPendKey: 'pend:out-D', nextPoolKey: poolKey, nextPendKey: 'pend:out-D-2' }),
      delayChipProcess(createArrayOutputChip({ key: 'chip:out-D-0', prevPoolKey: poolKey, prevPendKey: 'pend:out-D-2', IOP: endIOP0 }), 20),
      delayChipProcess(createArrayOutputChip({ key: 'chip:out-D-1', prevPoolKey: poolKey, prevPendKey: 'pend:out-D-2', IOP: endIOP1 }), 16)
    ])

    const chipOutC = chipMap.get('chip:out-C')

    const { attach, trigger, describe } = createRunlet(quickConfigPend(poolMap, chipMap))
    attach()
    trigger()
    __DEV__ && info('==== runlet.describe ====')
    __DEV__ && info(describe().join('\n'))

    const [ result0, result1 ] = await Promise.all([ endIOP0.promise, endIOP1.promise ])
    __DEV__ && console.log('result0', JSON.stringify(result0))
    __DEV__ && console.log('result1', JSON.stringify(result1))
    strictEqual(result0.length + result1.length, 10)
    strictEqual(result0.length > 0, true)
    strictEqual(result1.length > 0, true)

    await setTimeoutAsync(1)
    __DEV__ && info('==== runlet.describe ====')
    __DEV__ && info(describe().join('\n'))
  })

  it('createRunlet() active, very messy setup', async () => {
    const endIOP0 = createInsideOutPromise()
    const endIOP1 = createInsideOutPromise()

    const poolMap = toPoolMap([
      PoolIO,
      createCountPool({ key: poolKey, sizeLimit: 5 })
    ])
    const chipMapB = toChipMap([
      delayChipProcess(createArrayInputChip({ key: 'chip:input-B', nextPoolKey: poolKey, nextPendKey: 'pend:out-B', array: getSample((index) => ({ type: 'B', index }), 15) }), 4),
      delayChipProcess(createSample1toNChip({
        key: 'chip:trans-B-C', prevPoolKey: poolKey, prevPendKey: 'pend:out-B', nextPoolKey: poolKey, nextPendKey: 'pend:out-C',
        splitCount: 2, splitValue: async (value, index, indexMax) => ({ type: 'C', index: (value.index + index * 0.01) })
      }), 8),
      createAsyncIteratorOutputChip({ key: 'chip:out-C', prevPoolKey: poolKey, prevPendKey: 'pend:out-C' }) // jump wire
    ])
    const chipOutC = chipMapB.get('chip:out-C')

    const chipMapMain = toChipMap([
      delayChipProcess(createArrayInputChip({
        key: 'chip:input-A', nextPoolKey: poolKey, nextPendKey: 'pend:out-A',
        array: getSample((index) => ({ type: 'A', index }), 30)
      }), 12),
      {
        key: 'chip:merge-trans-A-C', prevPoolKey: poolKey, prevPendKey: 'pend:out-A', nextPoolKey: poolKey, nextPendKey: 'pend:out-D',
        state: { AList: [], CList: [] },
        process: async (pack, state, error) => {
          if (error) return
          if (pack[ 1 ] === END) { // do not flush remain A/C, but try drain C
            if (!(await chipOutC.next()).done) throw new Error('unexpected C state')
            return { pack, state }
          }
          state.AList.push(pack[ 0 ])
          if (state.AList.length < 3) return { pack: createPack(undefined, SKIP), state } // get more A
          while (state.CList.length < 3) {
            const { value, done } = await chipOutC.next()
            if (done) throw new Error('unexpected C END')
            state.CList.push(value)
          }
          const valueD = { type: 'D', content: [ ...state.AList, ...state.CList ] }
          state.AList.length = state.CList.length = 0
          return { pack: createPack(valueD, undefined), state }
        }
      },
      createENDRegulatorChip({ outputChipCount: 2, prevPoolKey: poolKey, prevPendKey: 'pend:out-D', nextPoolKey: poolKey, nextPendKey: 'pend:out-D-2' }),
      delayChipProcess(createArrayOutputChip({ key: 'chip:out-D-0', prevPoolKey: poolKey, prevPendKey: 'pend:out-D-2', IOP: endIOP0 }), 20),
      delayChipProcess(createArrayOutputChip({ key: 'chip:out-D-1', prevPoolKey: poolKey, prevPendKey: 'pend:out-D-2', IOP: endIOP1 }), 16)
    ])

    const runletB = createRunlet(quickConfigPend(poolMap, chipMapB))
    runletB.attach()
    runletB.trigger()
    const runletMain = createRunlet(quickConfigPend(poolMap, chipMapMain))
    runletMain.attach()
    runletMain.trigger()
    __DEV__ && info('==== runlet.describe ====')
    __DEV__ && info(runletB.describe().join('\n'))
    __DEV__ && info(runletMain.describe().join('\n'))

    const [ result0, result1 ] = await Promise.all([ endIOP0.promise, endIOP1.promise ])
    __DEV__ && console.log('result0', JSON.stringify(result0))
    __DEV__ && console.log('result1', JSON.stringify(result1))
    strictEqual(result0.length + result1.length, 10)
    strictEqual(result0.length > 0, true)
    strictEqual(result1.length > 0, true)

    await setTimeoutAsync(1)
    __DEV__ && info('==== runlet.describe ====')
    __DEV__ && info(runletB.describe().join('\n'))
    __DEV__ && info(runletMain.describe().join('\n'))
  })
})

const delayChipProcess = (
  chip,
  delay = 0 // in msec
) => ({
  ...chip,
  sync: false, process: async (pack, state, error) => {
    !error && await setTimeoutAsync(delay) // no delay on error
    return chip.process(pack, state, error)
  }
})

const createSample1toNChip = ({
  splitCount = 42, // how many value to split
  splitValue = async (value, index, indexMax) => `${value}[${index + 1}/${indexMax}]`,
  key = 'chip:sample:1toN', ...extra
}) => ({
  ...extra, key, state: { index: 0, indexMax: splitCount },
  process: async (pack, state, error) => {
    if (error) return
    if (pack[ 1 ] === END) return { pack, state }
    const { index, indexMax } = state
    const value = await splitValue(pack[ 0 ], index, indexMax)
    state.index = (state.index + 1) % indexMax
    return { pack: createPack(value, state.index !== 0 ? REDO : undefined), state }
  }
})

const createSampleNto1Chip = ({
  mergeCount = 42, // how many value to merge
  mergeValue = async (valueList, indexMax) => `${valueList.join(',')} [${valueList.length}/${indexMax}]`,
  key = 'chip:sample:Nto1', ...extra
}) => ({
  ...extra, key, state: { index: 0, indexMax: mergeCount, valueList: [] },
  process: async (pack, state, error) => {
    if (error) return
    const [ , hint ] = pack
    if (hint === undefined) { // have inputValue
      const { indexMax, valueList } = state
      valueList.push(pack[ 0 ])
      state.index = (state.index + 1) % indexMax
    }
    if (hint === END && state.index === 0) return { pack, state } // END & empty
    else if (hint !== END && state.index !== 0) return { pack: createPack(undefined, SKIP), state } // has more
    else {
      const { indexMax, valueList } = state
      const value = await mergeValue(valueList, indexMax)
      valueList.length = state.index = 0 // reset state.index for REDO
      return { pack: createPack(value, hint === END ? REDO : undefined), state }
    }
  }
})
