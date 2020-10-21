# Async*Queue & AsyncLane & AsyncTask


## `Async*Queue`

It's good to have a structure for keep chaining/queueing up promises and async functions.

`AsyncFuncQueue` is the basic queueing structure,
  for `AsyncFunction`, as the name suggests.
And do check the comments & tests for details.

As minimal as the code goes, `Async*Queue` only keep the size,
  so outer code will need to save the pending runs if needed.

#### `AsyncTask`

For heavier async codes, getting the status and cancellation will be needed.
Thus, the `AsyncTask` structure, a `Promise` in `Object`.
And `AsyncTaskQueue` to queue and run `AsyncTask`.


## `AsyncLane`

Though by meaning, a "lane" is similar to a "queue",
  here an `AsyncLane` contains multiple `Async*Queue`.

And there's `extend*` to add support for auto lane assignment,
  like common "min-load" strategy.
Extend can also add more data to lane, like tracking pending tasks.

#### Optimize `extend*` performance

Most of provided extend aim for composability instead of speed,
  for specific need it's better to write a custom all-in-1 extend.
