# About WatchLoop


The main design goal is to be very simple,
  so the main watch loop is literally an async `while (true) {}`.

For the loop code, the most clear & simple way to deal with state-change-through-time,
  besides just doing nothing, is to use a state machine.

All main loop logic is packed as somewhat-pure async functions,
  taking config & state as input,
  should be simpler to read & test.


## clue

The main state for a `unit` (ie a process/server/service) is `missing` and `found`,
  to find the `unit`, some clue is needed,
  like `pidFile`, `command line pattern`, `docker container name pattern`.


## fast loop & slow loop

Once all the main process of each `unit`s are found, the next few loop can be a "fast loop",
  meaning the next loop will just check all process with pid still exist,
  a normal loop that'll get a fresh system process list and do clue matching is called "slow loop".

Assume all units are stable prod code,
  a 5sec loop interval and 5 fast 1 slow pattern should be good.
And the worst case sill be some `unit` keep missing (failed to start),
  and cause all loop to be "slow loop", wasting a bit of CPU power every 5sec.


## some notes

For most `unit`, the `found` state should often equal as "functional",
  but there can be zombie processes,
  like a zombie server which is alive but do not accept requests.

So proper health/status check is also needed, and zombie should get killed regularly.
