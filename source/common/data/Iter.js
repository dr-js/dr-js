const unwrap = ({
  iterable, // { [ Symbol.asyncIterator ] } or { [ Symbol.iterator ] }
  iterator = iterable && (iterable[ Symbol.asyncIterator ] || iterable[ Symbol.iterator ]).call(iterable), // { next: async () => ({ value, done }) }
  next = iterator && iterator.next.bind(iterator) // async or sync
}) => next

const wrapSync = (next) => ({
  next, // as sync iterator
  [ Symbol.iterator ]: () => ({ next }) // as sync iterable
})

const wrapAsync = (next) => ({
  next, // as async iterator
  [ Symbol.asyncIterator ]: () => ({ next }) // as async iterable
})

export {
  unwrap,
  wrapSync, wrapAsync
}