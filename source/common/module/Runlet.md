# Runlet: Thought on Stream


## Stream in script language

Having dealt with Stream data for a long time,
  but not actually take time and think what the Stream code do provide,
  or what feature to expect,
  it's time to pay the debt of thoughts.

The idea of Stream is simple,
  but looking at actual implementation often it's really complex
    (check [Nodejs Stream](https://nodejs.org/api/stream.html),
    or [Web Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API))

Nevertheless, ignore those for now,
  let's just start by locking the basic feature set.

First a look of simpler sort-of-stream patterns:
- `for` loop & `array.map()`:
    Process queue of data one by one,
    the logic is really obvious,
    but the queue length is limited and must be known beforehand.
- Iterator:
    Generalized loop pattern,
    no length required,
    with still obvious logic.
- AsyncIterator:
    Make most sense in script language like JS/Lua/P\w+,
    where most heavy work can be sent off the main thread to some worker thread,
    so the main thread can just focus on the job scheduling and not get blocked.

    In C like language without the script/native boundary,
    AsyncIterator make less sense,
    most just do multi-thread coding directly or employ job threads.
- `fs.getchar()` loop:
    Basic required skill to process 4GiB sized file with a 512MiB of RAM machine,
    or support shell pipe,
    the total file size can just be unknown, or unlimited like `cat /dev/urandom` (don't do this).

    Different from above pull-based stream-alike,
    this one is more push-based,
    the process will block and wait upstream to actively send(push) data.
- `fs.readline()` loop:
    Like `fs.getchar()`,
    often with internal buffer to keep what read and prevent re-read it again next loop,
    some `readline` buffer 8KiB or more ahead to reduce the IO wait.

Then a list of common stream usage:
- file stream
    (read/write: send or receive, often at the end of pipeline)
- socket stream
    (duplex: send and receive, often at the end of pipeline)
- encode/decode/gzip/gunzip/crypto/hash stream
    (transform: receive and process data then send out, often in the middle of pipeline)

And last a limit to the topic scope:
  here we only discuss the stream pattern in script language.
Unlike most compiled language,
  in which stream means passing value in order, the stream got more complex,
  with features like buffer/backpressure, async process function, merge/split attached. 
In script land, the stream is more like a Job system or Message queue,
  and most heavy work like file or socket IO is handled in separate thread,
  and often in native language like C.

> Think of a stream pipeline for a fictional Node.js "Web-based unzip service",
>   the main JS thread just need to handle client connection and pipeline setup,
>   and the actual decompress is done in native worker thread.
> This pattern is clear and quite efficient for script language.


## Stream feature

Most Stream implementation will provide features like:
- read, write, or both (duplex/transform)
- chunked data:
    reduced memory usage
- buffering:
    between every worker or only at some point, needed for backpressure
- async worker:
    often means send work to worker thread, keep the main thread active
- keep data order:
    with async it's a bit harder, and most event system lack this when mixed with async
- support varied transform ratio:
    most process input/output ratio should be  `1:1`, but some like compress `N:1` or decompress `1:N`
- auto-flow:
    repeatedly automatically send data through till the source is dry
- backpressure:
    pause when the buffer is full enough, and resume when it gets emptier

But most Stream implementation is also quite bloated,
  to keep the feature while reducing the actual code,
  let's start by morphing the process model.

First imagine data on a single long conveyor belt, like:
```
Producer    9 8 7 6 5 4 3 2 1    Consumer
          >>>>>>>>>>>>>>>>>>>>>
```

Think multiple conveyor working together,
  like many robotic arm moving data between boxes:
  (like in the game [Factorio](https://factorio.com))
```
Producer [9,8,7] [6,5,4,3] [2,1] Consumer
       |->     |->       |->   |->   Worker
```

In some sense,
  a full-featured stream in scripting language is comparable to a job system for compiled language,
  so similar to how we use shared memory,
  we could use a shared buffer for the whole pipeline,
  to free Worker code from buffer management.
```
Producer 9>>>>>>>6>>>>>>>>>2>>>> Consumer
       |->     |->       |->   |->   Worker
        [    8,7     5,4,3     1]    SharedBuffer
```

Then try ditching the linear pipeline mindset,
  and accept some absurd combo can be setup like:
```
Producer   Producer   Producer   Producer
        [  9,      8,      7    ]    SharedBuffer
           |->     |->     |->       Worker Group
        [ 6,    5,    4,    3   ]    SharedBuffer
          |->   |->   |->   |->      Worker Group
        [ 2,1                   ]    SharedBuffer
  Consumer      Consumer      Consumer
```

So to sum up:
- think the value to process is on a big plate,
    which is the shared buffer.
- the worker group pick up the value, process, and put it back.
- each stage of processed value is sorted to a corner of the plate,
    but with dynamic space/size.

The shared buffer can provide benefits like:
- easily limit and distribute the total buffer size:
    the worst case runtime buffer size should be `shared buffer size + sum of value average size each worker is processing`,
    and reserve private buffer can be setup
- allow dynamic size adjustment:
    most space will be left for slow worker,
    since fast worker will drain their part
- less total code, no buffer manage code in worker, and simpler error situation:
    for proper tested outer code,
    error should be either from the worker code,
    or the value passing code
- can support custom buffer manage code:
    normally just use a basic array for "Object" value by count,
    but for some case, use advanced buffer alloc/free for speed,
    or even direct map to memory stack/heap if really needed
- allow complex graph,
    and support multiple SharedBuffer/Worker/Producer/Consumer,
    maybe it's a bad idea though

To also simplify the stream code, basically we want to just provide:
- Produce: `async () => value`
- Transform: `async (value) => value`
- Consume: `async (value) => {}`
And the wrapper should just magically archive semi-auto-push with backpressure support!


## The Runlet

Runlet is a Stream with less code and clearer execution order.

Before the follow-up discussion, some word mapping:
- Runlet: the Stream, the whole pipeline, a directional graph with the logic for value passing work
- Chip: the Worker, or the `|->` mark, the logic to operate on the value (no buffer/queue code) 
- Pool: the SharedBuffer, with a max limit by value count or byte size, manage get/set and report total size
- Pend: part of Pool, dynamic for each Chip, mostly queue of value

A Runlet will contain multiple Pool and Chip,
  a Chip will declare it's prev/next Pend from any Pool,
  a manual step for Chip-Pend attach is required before flowing the values

And some additional concepts:
- pack: a simple 3-value-array, to hold the data and extra info
- Chipset: group of Chip work together
- Chip's Pend: the prev Pend of the Chip
- Input Chip: Producer, a Chip that receive nothing(SKIP) and return value
- Output Chip: Consumer, a Chip that receive value and return nothing(SKIP)
- IO Pool: a special Pool with special Pend for I/O Chips to use, holding no data

A basic linear Runlet will be:
```
<Linear Runlet with IO Chip (active)>         | <Linear Runlet without IO Chip (passive)>
        [                       ]    Pool     |         [                       ]    Pool
             [     ] [     ]         Pend     |         [  ] [     ] [     ] [  ]    Pend
       Input->     |->     |-Output  ChipSet  |            |->     |->     |->       ChipSet
        []                     []    IO Pend  |
        [                       ]    IO Pool  |
```

A more detailed look at each piece:

#### Runlet pattern

```js
// hint:
//   Special symbol used to signal Chip and Pool how the flow should change,
//     send along with value in pack
const END = Symbol('runlet:hint:end') // for Chip receive/return, without value, meaning returning chip will not process/output more value (NOTE: to support split flow, allow return Number as value to pushPend extra END)
const SKIP = Symbol('runlet:hint:skip') // for Chip receive/return, without value, meaning chip want more input for an output (ratio N:1)
const REDO = Symbol('runlet:hint:redo') // for Chip return only, with value, meaning chip will output more for same input (ratio 1:N) (NOTE: do not pack reuse with REDO, and the pack will stay in runningChipMap when REDO)

// pack:
//   Simple array hold max 3 values, all may be `undefined`:
//   - `pack[ 0 ]`: the value, the data to send downstream
//   - `pack[ 1 ]`: hint, to signal flow change
//   - `pack[ 2 ]`: a promise, when the Chip process is running
//   The pack passing between Pend & Chip is always visible:
//   - most pack should be in one of the Pends
//   - a running Chip will hold a sin
const createPack = (value, hint) => [ value, hint, undefined /* promise */ ] // at `pack[ 2 ]` holds the promise of the running Chip process

//   Only do bare minimum work, no extra check,
//     and this is a general purpose non-optimal implementation.
//   Do not provide END callback, user need to get that from Output Chip,
//     this is for supporting Runlet with multi Output Chip, where multi END will be in flight.
//   Final outcome should be either END or error, and `error.isAbort = true` is recommended for abort.
//   No auto-close for Pool/Chip with external IO, and need manual init/clear outside Runlet.
const createRunlet = ({
  poolMap = new Map(),
  chipMap = new Map(),
  onError = (error) => { throw error } // normal error should handled in Chip, this is mostly for Bug reporting, should just report & crash
}) => {
  let isPause = false
  let isValid = true // marker to cut value passing after runlet detach

  return {
    poolMap,
    chipMap,

    getIsValid: () => isValid,
    getIsPause: () => isPause,
    setIsPause: (value) => { isPause = value },
    pause: () => { isPause = true }, // set pause flag to stop value passing/processing, will not stop running process
    resume: () => { isPause = false }, // unset pause flag, may need trigger() or push some value in to restore the flow

    attach: () => {}, // call this at lease once before start the flow, and after Pool/Chip change
    detach: () => ({ poolMap, chipMap, endChipKeySet, runningChipMap }), // cut off all Chip data flow, clear Pool, return running chip process
    trigger: () => {}, // trigger all runnable Chip: give a SKIP to signal InputChip, or passing value to Chip with prevPend

    // allow push/pull value to/from Pool Pend // NOTE: this is polling-based for sync peek/poke, for callback-based just add a Chip
    createPendInput: (poolKey, pendKey) => ({ pool, push: (pack) => pack, canPush: () => Boolean() }),
    createPendOutput: (poolKey, pendKey) => ({ pool, pull: () => (pack || undefined), canPull: () => Boolean() }),

    describe: () => [ 'runlet info' ] // for debug & monitor runlet status
  }
}
```

#### Pool pattern

```js
// Pool:
//   The default Pool should use the key `default`,
//     and there's a special IO Pool with Pend for Input/Output Chip.
//   This pattern should support basic array implementation,
//     as well as advanced no-alloc buffer with custom Runlet code.
const createCountPool = ({ // TODO: for fast zero-copy buffer, should let Pool & Chip acquire Buffer from an optimized SharedBufferPool
  key = 'default', // String || Symbol
  sizeLimit: poolSizeLimit // Number
}) => {
  let poolSize = 0 // sum of all pend, size can be count or byte, sizePrivate is always counted
  const pendMap = new Map() // pendKey: { packQueue: [], size, sizePrivate, sizeLimit }
  return {
    key,
    pendKeyGroupMap: undefined, // new Map() // groupTag: pendKeyGroupSet // not used here, for marking group of Pend act together as one Pend, so the wakeKeySet is shared
    reset: () => {},
    getPoolSize: () => poolSize,
    configPend: (pendKey, sizePrivate = 0, sizeLimit = Infinity, ...extraConfig) => {}, // assign Pend exclusive size // NOTE: will reset existing pend, and should config all Pend before use
    // below assume all related `configPend` is called
    isPendLimited: (pendKey) => Boolean(), // allow sizePrivate to bust sizeLimit (also must have at lease 1 value)
    getPendSize: (pendKey) => pendMap.get(pendKey).size,
    pushPend: (pendKey, pack) => {},
    pullPend: (pendKey) => pack,
    describe: (stringList = [], getPoolExtraInfo, getPendExtraInfo) => stringList
  }
}

// PoolIO:
//   A special static Pool for I/O Chip to use, only output SKIP, and error on other operation
const KEY_POOL_IO = Symbol('runlet:pool:io') // for Input/Output Chip's prevPoolKey/nextPoolKey
const KEY_PEND_INPUT = Symbol('runlet:pend:input') // for Input Chip's prevPendKey
const KEY_PEND_OUTPUT = Symbol('runlet:pend:output') // for Output Chip's nextPendKey
const PoolIO = {
  key: KEY_POOL_IO,
  pendKeyGroupMap: undefined,
  reset: () => {},
  getPoolSize: () => 0,
  configPend: (pendKey, sizePrivate = 0) => {
    if (pendKey !== KEY_PEND_INPUT && pendKey !== KEY_PEND_OUTPUT) throw new Error(`invalid IO config pendKey: ${String(pendKey)}`)
    if (sizePrivate) throw new Error(`invalid IO config sizePrivate: ${sizePrivate} for pendKey: ${String(pendKey)}`)
  },
  isPendLimited: (pendKey) => pendKey !== KEY_PEND_OUTPUT, // only allow output
  getPendSize: (pendKey) => pendKey === KEY_PEND_INPUT ? 1 : 0,
  pushPend: (pendKey, value) => {
    if (pendKey === KEY_PEND_OUTPUT && value[ 1 ] === END) return
    throw new Error(`invalid IO push pendKey: ${String(pendKey)}, value: ${String(value)}`)
  },
  pullPend: (pendKey) => {
    if (pendKey === KEY_PEND_INPUT) return createPack(undefined, SKIP) // NOTE: must be new pack since downstream may keep reuse the pack
    else throw new Error(`invalid IO shift pendKey: ${String(pendKey)}`)
  },
  describe: (stringList = [], getPoolExtraInfo, getPendExtraInfo) => {
    stringList.push(`@${String(KEY_POOL_IO)}`)
    return stringList
  }
}
```

#### Chip pattern
```js
// Chip:
//   Should be as simple as possible, but also do not divide work too much,
//     since pack passing still has costs.
//   Added state to store side effect, so the process function can be pure function, conceptually.
//   For performance, the state is expected to be changed by direct mutate so less GC involved,
//     but it may be reasonable to go full immutable for some case.

// ChipSyncBasic:
//   A sample pass-though Chip of all supported config.
const ChipSyncBasic = {
  key: 'chip:sync-basic',
  prevPoolKey: KEY_POOL_IO, prevPendKey: KEY_PEND_INPUT, prevPendSizePrivate: 0, prevPendSizeLimit: Infinity, prevPendLogic: {}, // all after PendSize is optional
  nextPoolKey: KEY_POOL_IO, nextPendKey: KEY_PEND_OUTPUT, nextPendSizePrivate: 0, nextPendSizeLimit: Infinity, nextPendLogic: {}, // all after PendSize is optional
  state: {}, // optional
  sync: true, // will get faster loop (no added await)
  process: (pack, state, error) => error ? undefined : { pack, state }, // pass through
  describe: () => 'CHIP-SYNC-BASIC' // optional
}

// ENDRegulatorChip:
//   Needed after the merge Pend after 2+ Input Chip, so only the last END pass,
//     or before the split Pend before 2+ Output Chip, so there's enough END for each.
const createENDRegulatorChip = ({
  inputChipCount = 1, outputChipCount = 1, // should pass in at least a 2+, or just skip this Chip
  key = 'chip:end-regulator',
  ...extra // all the extra Pool/Pend config
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
```

By design, only the Runlet need to maintain the flow to be active/auto,
  so the Pool & Chip code can be passive and minimal,
  and easier for user to write custom ones.
The config/declarative code style is used,
  since most time there's no need to alter the flow after Runlet is built,
  and this can make planning more complex flow graph easier.
The execution order is optimised to allow more repeat of the same process,
  with the help of Pool buffering, hoping the CPU cache hit chance can be higher.
The pattern aim to make the flow state as transparent as possible,
  so the user can predict the state whether the flow is running, end, or error,
  while keep each part's job clear cut and hard to mix-up.

> Note that by definition the Runlet is a directional graph,
>   so the shape can be tree or loop.
>   (TODO: this level of complexity really needed?)
> And a Runlet can have more than one Pool.

#### the Chip's Pend:
```
[ reserved | under limit   | busted                    ]
  reserved: kept private for Pend, and always allow at least one value
           | under limit: shared & dynamic in Pool, can fill more if there's free size available
                           | busted: over the size limit, the Runlet data flow should pause
```

#### `1:N`/`N:1` ratio support

With the hint `SKIP` and `REDO`,
  Runlet can support value process ratio other than `1:1`.
Just return `SKIP` with no output,
  if the input is not enough to generate a result.
Or return `REDO` with the first chunk of output,
  the Chip will receive the same input again,
  allow more output to be generated.
And with the `Chip.state` as optional data store,
  most work should be possible to implement.

#### LogicalPool

Currently,
  flow unordered-merge or random-split can be supported naturally by push/pull to/from the same Pend,
  but for flow duplicate/load-balance which requires to pushing to a specific Pend,
  custom Pend logic is needed.

Think of the duplicate flow, 
  since the backpressure from both downstream can both choke the single upstream Chip,
  there may be dead lock,
  so doing this implicitly in the same Runlet is not a good idea.

Without turning to something hacky,
  like creatComplexRunlet or magicChip that have access to Pool/Pend,
  or add a getNextPendKey function to Chip,
  we propose a solution with LogicalPool.
  
With LogicalPool,
  Pend is divided as PendView & PendViewee,
  with custom code slot left open.
The PendView should hold no data, like an SQL Table View,
  and provide logic to push/pull to/from PendViewee.
And the PendViewee can be just like normal Pend,
  holding data, and can have extra logic if needed.
This can will allow most use case to preserve the backpressure,
  even between multiple Pends.

Or just introduce more Runlets like sub-Runlet, or inter-Runlet,
  so each single Runlet can still be understandable,
  while exposing the backpressure problem for user to choose a proper strategy.

#### Error

Assume the Runlet code is perfectly error-free (which may not be true, yet),
  then all error should occur in Pend or Chip.
When the first error occurs, it will be packed and passed to all Chip in sync mode,
  then the Runlet will be set to detached mode.
Most Chip process can just ignore and return,
  but the Output Chip should notify outer code,
  and Chip with external IO may need to start the release process.
And there's an extra `onError` Runlet option,
  to receive the second or more error generated after detach,
  but most code should just stop and be still.


## Random design thoughts

Most stream/step/iterator will try to min-max at different aspects:
- runlet/stream:
    support complex setup +
    saturate multi-thread worker +
    max resource usage under certain limit +
    less CPU cache miss (with buffer) +
    good global speed
- for-loop/iterator:
    simple & sync +
    ASAP process at each value loop +
    good local speed

Chip execution order choice:
- re-run first: (self, prev, next) [preferred]
    For each Chip, prefer re-run itself till the Chip's Pend is empty or Pool is full.
    This allows same code run more often in group, and may receive CPU cache hit boost.
    Pend close to Input may get filled fast on start-up,
      and need time to balance: `I [9985321] O -> I [5555444] O`.
- pass-down first: (next, self, prev) [not used, just use for-loop?]
    For each Chip, prefer run next Chip if Pool not full.
    This may mix up code runs more often, thus incur more related CPU cache miss,
      but the first output should be sooner.
    And all Pend will get filled up at a lower rate: `I [1111111] O -> I [5555444] O`

Chip trigger strategy: 
- start as many Chips as possible: [preferred]
    Should be better for scripting language with native worker thread.
    The downside maybe the concurrency is to big and thus pressure the system resource.
- only one/sequential Chip is active:
    This basically reduced a Runlet to a for-loop,
      maybe not good for most case.
- allow passing custom algorithm:
    Maybe a custom Runlet is better, since most Runlet code is related and not modular.

FAQ-ish answers:
- Runlet will not solve all data processing problems:
    It's more bloated than for-loop/Iterator, maybe slower in some case,
      but can give certain property, and make some problem easier to reason about.
- There is no actual hard size limit enforced on Pool/Pend:
    The code can still eat up all memory,
      for example some huge Input value being pushed,
      or Chip processing a zip-bomb without doing proper chunked output.
    A strange behavior is the basic leaner Runlet can finish with Pool size limit set to 0,
      the "must have at lease 1 value" Pend rule caused this.
- Is Runlet push or pull or both?
    It depends on the actual setup,
      once triggered, Runlet should self re-trigger till the Pool is filled, Or the END pass the flow.
    The active mode means there's Output Chip pull value out the Pool,
      keeping the re-trigger happen till all is done.
    And the passive mode means something is limited,
      with a big Pool there'll still be some re-trigger happening.
- Can proper Pool size be auto derived from ChipSet?
    Maybe, like for each Chip default give `count=3` or `byte=16K`,
      and add Chip's Pend size requirement.


## TODO

- Prove auto-flow will not stop unless the Pool is full,
    and require manual start after pull from output.
  Or: when the Runlet auto-flow stops,
    the last Chip run can only be the Last Output Chip while the next Pend must be full,
    no other condition.
- Code goal for long-running Runlet:
  - minimal side-effect
  - minimal allocation/GC
  - minimal function call (non-process overhead)
  - minimal buffer move/copy


## Reference 

#### Some existing implementation

- C++ `"iostream.h"`:
    sync push stream,
    often have buffer at both ends, but rarely in the middle,
    no concept of backpressure, since single threaded C++ often run fast enough.
- Node.js [Stream](https://github.com/nodejs/node/blob/master/lib/internal/stream_base_commons.js):
    > Streams can be readable, writable, or both. All streams are instances of EventEmitter.
    >   Both Writable and Readable streams will store data in an internal buffer that can be retrieved using writable.writableBuffer or readable.readableBuffer, respectively.
    >   The amount of data potentially buffered depends on the highWaterMark option passed into the stream's constructor.
    >   The highWaterMark option is a threshold, not a limit: it dictates the amount of data that a stream buffers before it stops asking for more data.
    >
    > Readable streams effectively operate in one of two modes: flowing and paused.
    >   If a Readable is switched into flowing mode and there are no consumers available to handle the data, that data will be lost.

    seems to be inner C++ implementation with outer JS wrapper.
    async push&pull stream,
    have buffer at each readable/writable, support both event & direct call API,
    support backpressure by [design](https://nodejs.org/en/docs/guides/backpressuring-in-streams/),
    most fs/net IO is done in helper thread to unblock the main thread.
    need setup `pipe()` each individually.
    have a quite complicated [history](https://dominictarr.com/post/145135293917/history-of-streams),
    and the API is [hard](https://nodejs.org/api/stream.html#stream_additional_notes), better get a wrapper for most operation or there may be leak.
- [minipass](https://npm.im/minipass):
    > A very minimal implementation of a Node.js PassThrough stream
    > Minipass streams are designed to support synchronous use-cases. Thus, data is emitted as soon as it is available, always.
    > It is buffered until read, but no longer.
    
    the idea is to maks stream fast, by making more stream code sync
- [push-stream](https://github.com/push-stream/push-stream) / [pull-stream](https://dominictarr.com/post/149248845122/pull-streams-pull-streams-are-a-very-simple):
    much less code with similar feature set,
    sync/callback push stream,
    can have buffer if needed,
    support backpressure with a `paused` value.
    most code is in Sink/Source Object, with a few outer help code,
    need setup each `pipe()` individually.
- Rxjs [Observable](https://rxjs.dev/guide/observable):
    > Observables are lazy Push collections of multiple values

    async push stream,
    upstream use `subscriber.next(value)` to push value downstream,
    no backpressure by default.
    allow setup pipeline for a list of worker.

#### About cache optimization

- https://lwn.net/Articles/255364/
- https://stackoverflow.com/questions/16699247/what-is-a-cache-friendly-code
- https://en.wikipedia.org/wiki/Loop_nest_optimization
- https://en.wikipedia.org/wiki/Locality_of_reference
