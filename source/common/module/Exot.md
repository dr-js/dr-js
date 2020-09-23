# Exot, Error handling, and Bugs


## Error and Bug

Error is a special kind of event:
  it's message bubble up the call stack,
  the `catch` setup listener to receive and maybe resolve the problem (often by retry),
  if the top call stack is reached, program should exit (by crash).

Error should be well-defined, classified, can be enumerated easily,
  and better be all taken care of before the code ships.
For well written code,
  unexpected Error should not exist,
  or there's a Bug. (despite most Error message states: "unexpected sth happened")

Error handling do not handle Bug,
  abet Bug also get reported in form of Error.
  Correct Error handling also should not mask Bug Error.

To avoid confusion:
  Here we define Bug as unexpected code state,
    which resulting in unexpected execution path,
    we can't handle Bug since it's unexpected, but instead we do Bug reporting.
  And in the following text,
    we use Error to only refer to those expected Error message, which can and needed to be handled.
  In other words:
    a perfect imaginary Bug-free codebase can still use Error and Error handling for some logic.


## Error handling

Not all code require Error handling.
  For low level function with controlled input, limited scope and no callout to external IO,
    it's possible to prove the logic is valid 100%. (or say there's no Error, just Bug)
  But when working with code like user input and external IO,
    there will be unsupported input or interrupted/timeout IO state/event,
    sometimes it's easier to just Error, instead of report the problem in returned result.

Normally for IO related code,
  if it's short like a file open call, just in-place `try catch` should be enough.

For long-running IO like an opened TCP socket,
  Error may happen when you are not calling their function, and being reported as event.
  Error like network failure event may need outside code help to close the TCP socket properly,
  that's at least a `try catch` plus some extra code in catch and re-throw.

Thing get really mixed up when you need to work with multiple long-running IO:
  like write a TCP proxy, or TCP multiplexer,
  it's a lot more code to properly close all long-running IO for an Error event handling.


## Exot pattern

To use these long existing external IO (or simply leak-able resource) with less code and simpler logic,
  we define a pattern to wrap those as **Exot**,
  and some support function to help manage multiple Exot lifecycle.

Exot is short for "Exot-ic",
  a pattern for wrapping external IO or Resource that require manual `up` and `down`.

```js
const createExot = ({ // most Exot create func should be just sync, and move async things to up()
  id = getRandomId() // unique string id, or specific name for singleton like "server-HTTP"
  // other option to config this Exot
}) => ({
  id,
  up: async ( // NOTE: can also be sync, outer func better use await for both
    // can be OPTIONAL, use to notify the ExotError during or outside of function call,
    // if this happen, non-expert outside code should just `down` this Exot and restart to get a safe state
    onExotError = (error) => { 'report up and maybe restart'; down() }
  ) => {},
  down: async () => {}, // should not throw and clear external IO (unless Bugged) // NOTE: can also be sync, outer func better use await for both
  isUp: () => false, // should be set to `true` on the last line of `up`, and to `false` the first line of `down`
  // other func for sync/async data exchange (IO), error from here should be input/result checking related (or doc it clearly)
  // - async func should continue on success, drop on ExotError, throw on input Error (Bug)
  // - sync func should report all error, since it can not stop the later code
})
```

Exot should behave like basic state container:
  minimal and atomic func exposed,
  no auto restart or retry logic (magic),
  and leave all control to the outer code.

Exot code is expected to view from 2 separate level:
- higher lifecycle-manage level, outer code:
    call Exot `up`, `down`, and track `onExotError` to maintain Exot in a usable state
- lower operation-execute level, user code:
    call Exot async func to exchange data, handle input/result check Error, and implement timeout/retry if needed

Meaning the lower user code sending an HTTP request do not need to handle if the network is dead,
  by default the follow-up logic will not run after ExotError, if explicit reject is needed a timeout or internal error can be provided.
And the higher outer code can `down` the Exot and exit, or try restart the whole process.

For the outer code, 
  the basic ExotError handle strategy is "success or reset", treat all ExotError as un-fixable,
  on ExotError outer code should `down` current Exot and get a new one.
From here, we can upgrade to "success, repair or reset",
  by adding plumbing code for each known fixable Error to keep current Exot usable.

Here's a list for the kind of Error to expect during the Exot lifecycle:
- `await exot.up(onExotError)`:
  - `resolve`: with `exot.isUp() === true`
  - `reject`: input check Error (with `exot.isUp() === false`)
  - `reject`: ExotError, failed to init (with `exot.isUp() === false`)
  - `reject`: Bug (undefined state)
- up & outside Exot func:
  - `onExotError`: Exot state-affecting error, like connection timeout or device lost
- up & within async Exot func: (like `await exot.loadDataAsync()`)
  - `onExotError`: Exot state-affecting error
  - `reject/throw`: input/result check Error (nothing bad happened yet, still valid state)
  - `reject/throw`: Bug (undefined state)
- up & within sync Exot func: (like `exot.loadDataSync()`)
  - `throw`: Exot state-affecting error
  - `throw`: input/result check Error (nothing bad happened yet, still valid state)
  - `throw`: Bug (undefined state)
- `await exot.down()`:
  - `resolve`: with `exot.isUp() === false`
  - `reject`: Bug (undefined state)


## Exot design choice

The Exot pattern is for wrapping a sizable or complex enough external-IO control code,
  and make using these code safer and easier.
For very small code or performance-first code, do not adopt this pattern simply,
  consider pack up enough layers or codes before wrap the module as Exot.

Some other design choice:
- The pattern should add minimal limits to both the implementation, and usage.
    And to make Exot composable, func behavior expect to be simple, direct, and clearly defined.
- Exot func should not auto-close Exot even for auto-closing resource,
    just `onExotError` with specific error to let outer code know and call `down` manually.
- No `onUp` and `onDown` support in Exot since the outer code have to manually call `up` and `down` anyway.
    But if needed this can be added to some Exot support function.
- Require outer code to prevent calling `up` when `down` is still not done,
    and not extend state to `up.../up/down.../down`.
    For most code using the Exot, the up(not-down) state is what matters most.
    And allow call `up` or `down` multiple times may hurt the outer control code by making all call seems to be a hit or miss.
- The Exot pattern mostly mimic C++ class constructor and destructor pattern,
    also both expect the clear up func never throw.


## Exot support function

Some ideas allow managing Exot easier:
- createExotGroup `(exotList) => Exot`:
  - combine many Exot as a whole, and `down` all on ExotError
  - [optional] allow dynamic add and remove Exot
  - [optional] allow restarting each Exot on Error
- withExotScopeAsync `async (exotList, async (upExotList) => {}) => {}`:
  - wait for all Exot `up`, run the `AsyncFunction`,
      and `down` all Exot on `resolve`,
      or `down` all Exot and re-throw error on `reject`


## reference

- https://stackoverflow.com/questions/2845183/how-to-handle-failure-to-release-a-resource-which-is-contained-in-a-smart-pointe
- https://stackoverflow.com/questions/341971/what-is-the-execute-around-idiom
