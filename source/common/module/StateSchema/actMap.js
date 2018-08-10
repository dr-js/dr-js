import {
  objectSet,
  objectDelete,
  objectMerge
} from 'source/common/immutable/Object'
import {
  arraySet,
  arrayDelete,
  arrayInsert,
  arrayPush,
  arrayUnshift,
  arrayPop,
  arrayShift,
  arrayConcat,
  arrayMatchPush,
  arrayMatchDelete,
  arrayMatchMove,
  arrayFindPush,
  arrayFindDelete,
  arrayFindMove,
  arrayFindSet
} from 'source/common/immutable/Array'

const replace = (state, payload) => payload

const objectActMap = {
  replace,
  set: (state, { key, value }) => objectSet(state, key, value),
  delete: (state, { key }) => objectDelete(state, key),
  merge: (state, { merge }) => objectMerge(state, merge)
}

const arrayActMap = {
  replace,
  set: (state, { index, value }) => arraySet(state, index, value),
  delete: (state, { index }) => arrayDelete(state, index),
  insert: (state, { index, value }) => arrayInsert(state, index, value),
  push: (state, { value }) => arrayPush(state, value),
  pop: (state, payload) => arrayPop(state),
  shift: (state, payload) => arrayShift(state),
  unshift: (state, { value }) => arrayUnshift(state, value),
  concat: (state, { concat }) => arrayConcat(state, concat),
  matchPush: (state, { value }) => arrayMatchPush(state, value),
  matchDelete: (state, { value }) => arrayMatchDelete(state, value),
  matchMove: (state, { index, value }) => arrayMatchMove(state, index, value),
  findPush: (state, { find, value }) => arrayFindPush(state, find, value),
  findDelete: (state, { find }) => arrayFindDelete(state, find),
  findMove: (state, { find, index }) => arrayFindMove(state, find, index),
  findSet: (state, { find, value }) => arrayFindSet(state, find, value)
}

export { objectActMap, arrayActMap } // TODO: DEPRECATED: move out since not that essential
