import { unwrap, createLockStepAsyncIter } from 'source/common/data/Iter'
import { createInsideOutPromise } from 'source/common/function'

import {
  END, SKIP,
  createPack,
  KEY_POOL_IO, KEY_PEND_INPUT, KEY_PEND_OUTPUT
} from './Runlet'

const createArrayInputChip = ({
  array = [], // will not change value
  state = { index: 0, indexMax: array.length, array },
  key = 'chip:input:array', ...extra
}) => ({
  ...extra, key, prevPoolKey: KEY_POOL_IO, prevPendKey: KEY_PEND_INPUT,
  state,
  process: async (pack, state, error) => {
    if (error) return
    if (__DEV__ && pack[ 1 ] !== SKIP) throw new Error(`unexpected input: ${[ ...pack, state, error ].map((v) => String(v)).join(', ')}`)
    if (state.index === state.indexMax) pack[ 1 ] = END
    else {
      pack[ 0 ] = state.array[ state.index ]
      pack[ 1 ] = undefined
      state.index++
    }
    return { pack, state }
  },
  describe: () => `[${state.index}/${state.indexMax}]`
})

const createArrayOutputChip = ({
  array = [], // will put ALL value in, until END
  state = { array },
  IOP = createInsideOutPromise(),
  key = 'chip:output:array', ...extra
}) => ({
  ...extra, key, nextPoolKey: KEY_POOL_IO, nextPendKey: KEY_PEND_OUTPUT,
  state,
  process: async (pack, state, error) => {
    if (error) return IOP.reject(error)
    if (pack[ 1 ] === END) IOP.resolve(state.array)
    else {
      state.array.push(pack[ 0 ])
      pack[ 0 ] = undefined
      pack[ 1 ] = SKIP
    }
    return { pack, state }
  },
  describe: () => `[${array.length}]`,
  promise: IOP.promise
})

const createAsyncIterInputChip = ({
  iterable, iterator, next = unwrap({ iterable, iterator }), // async or sync
  key = 'chip:input:async-iter', ...extra
}) => ({
  ...extra, key, prevPoolKey: KEY_POOL_IO, prevPendKey: KEY_PEND_INPUT,
  process: async (pack, state, error) => {
    if (error) return
    if (__DEV__ && pack[ 1 ] !== SKIP) throw new Error(`unexpected input: ${[ ...pack, state, error ].map((v) => String(v)).join(', ')}`)
    const { value, done } = await next() // TODO: NOTE: this will drop value when send with `done: true`
    const isEND = done === true
    pack[ 0 ] = isEND ? undefined : value
    pack[ 1 ] = isEND ? END : undefined
    return { pack, state }
  }
})

const createAsyncIterOutputChip = ({
  LSAI = createLockStepAsyncIter(),
  key = 'chip:output:async-iter', ...extra
}) => ({
  ...LSAI,
  ...extra, key, nextPoolKey: KEY_POOL_IO, nextPendKey: KEY_PEND_OUTPUT,
  process: async (pack, state, error) => {
    if (error) return LSAI.throw(error)
    const [ value, hint ] = pack
    const isEND = hint === END
    await LSAI.send(value, isEND)
    return { pack: isEND ? pack : createPack(undefined, SKIP), state } // don't reuse pack, the content may be reset before read
  }
})

// ENDRegulatorChip:
//   Needed after the merge Pend after 2+ Input Chip, so only the last END pass,
//     or before the split Pend before 2+ Output Chip, so there's enough END for each.
const createENDRegulatorChip = ({ // TODO: maybe use LogicalPool instead, so Pend will auto hold or dup END for M:N Chip ratio? Though this will make some Pend code more complex
  inputChipCount = 1, outputChipCount = 1, // should pass in at least a 2+, or just skip this Chip
  key = 'chip:end-regulator', ...extra // all the extra Pool/Pend config
}) => ({
  ...extra, key,
  state: { inputEND: inputChipCount, outputEND: outputChipCount },
  process: async (pack, state, error) => {
    if (error) return
    if (pack[ 1 ] === END) {
      state.inputEND--
      const pack = state.inputEND > 0
        ? createPack(undefined, SKIP)
        : createPack(state.outputEND >= 2 ? state.outputEND : undefined, END)
      return { pack, state }
    }
    return { pack, state } // pass through
  }
})

export {
  createArrayInputChip, createArrayOutputChip,
  createAsyncIterInputChip, createAsyncIterOutputChip,
  createENDRegulatorChip
}
