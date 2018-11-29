import { strictEqual, stringifyEqual } from 'source/common/verify'
import { isBasicObject } from 'source/common/check'
import {
  createTreeDepthFirstSearch,
  createTreeDepthFirstSearchAsync,
  createTreeBreadthFirstSearch,
  createTreeBreadthFirstSearchAsync,
  createTreeBottomUpSearch,
  createTreeBottomUpSearchAsync
} from './Tree'

const { describe, it } = global

const TEST_OBJECT = {
  a0: 'a0',
  aDIVIDE: { // a1: 'a1',
    b0: 'b0',
    b1: 'b1',
    bDIVIDE: { // b2: 'b2',
      c0: 'c0',
      c1: 'c1',
      c2: 'c2',
      c3: 'c3'
    },
    b3: 'b3'
  },
  a2: 'a2',
  a3: 'a3'
}

const TEST_NODE = [ 'start', TEST_OBJECT, -1, -1 ] // [ key, value, index, level ]
const TEST_BLANK_NODE = [ 'start', 'nop', -1, -1 ] // [ key, value, index, level ]

const TEST_GET_SUB_NODE_LIST_FUNC = ([ key, value, index, level ]) => isBasicObject(value) &&
  Object.entries(value)
    .map(([ subKey, subValue ], subIndex) => [ subKey, subValue, subIndex, level + 1 ])

const testTreeCommonSearch = async (objectSearch) => {
  strictEqual(
    await objectSearch(
      TEST_BLANK_NODE,
      ([ key, value, index, level ]) => { throw new Error('[TEST_BLANK_NODE] func should not be called') }
    ),
    undefined
  )

  stringifyEqual(
    await objectSearch(
      TEST_NODE,
      ([ key, value, index, level ]) => index === 2 && level === 1
    ),
    [ 'bDIVIDE', TEST_OBJECT.aDIVIDE.bDIVIDE, 2, 1 ]
  )

  stringifyEqual(
    await objectSearch(
      TEST_NODE,
      ([ key, value, index, level ]) => index === 1 && level === 2
    ),
    [ 'c1', 'c1', 1, 2 ]
  )
}

const testTreeDepthFirstSearch = async (objectDepthFirstSearch) => {
  const checkList = []
  strictEqual(
    await objectDepthFirstSearch(
      TEST_NODE,
      ([ key, value, index, level ]) => checkList.push([ key, value, index, level ]) && false // to collect all
    ),
    undefined
  )
  stringifyEqual(checkList, [
    [ 'a0', 'a0', 0, 0 ],
    [ 'aDIVIDE', TEST_OBJECT.aDIVIDE, 1, 0 ], // [ 'a1', 'a1', 1, 0 ],
    ...[
      [ 'b0', 'b0', 0, 1 ],
      [ 'b1', 'b1', 1, 1 ],
      [ 'bDIVIDE', TEST_OBJECT.aDIVIDE.bDIVIDE, 2, 1 ], // [ 'b2', 'b2', 2, 1 ],
      ...[
        [ 'c0', 'c0', 0, 2 ],
        [ 'c1', 'c1', 1, 2 ],
        [ 'c2', 'c2', 2, 2 ],
        [ 'c3', 'c3', 3, 2 ]
      ],
      [ 'b3', 'b3', 3, 1 ]
    ],
    [ 'a2', 'a2', 2, 0 ],
    [ 'a3', 'a3', 3, 0 ]
  ])

  await testTreeCommonSearch(objectDepthFirstSearch)
}

const testTreeBreadthFirstSearch = async (objectBreadthFirstSearch) => {
  const checkList = []
  strictEqual(
    await objectBreadthFirstSearch(
      TEST_NODE,
      ([ key, value, index, level ]) => checkList.push([ key, value, index, level ]) && false // to collect all
    ),
    undefined
  )
  stringifyEqual(checkList, [
    [ 'a0', 'a0', 0, 0 ],
    [ 'aDIVIDE', TEST_OBJECT.aDIVIDE, 1, 0 ], // [ 'a1', 'a1', 1, 0 ],
    [ 'a2', 'a2', 2, 0 ],
    [ 'a3', 'a3', 3, 0 ],
    ...[
      [ 'b0', 'b0', 0, 1 ],
      [ 'b1', 'b1', 1, 1 ],
      [ 'bDIVIDE', TEST_OBJECT.aDIVIDE.bDIVIDE, 2, 1 ], // [ 'b2', 'b2', 2, 1 ],
      [ 'b3', 'b3', 3, 1 ],
      ...[
        [ 'c0', 'c0', 0, 2 ],
        [ 'c1', 'c1', 1, 2 ],
        [ 'c2', 'c2', 2, 2 ],
        [ 'c3', 'c3', 3, 2 ]
      ]
    ]
  ])

  await testTreeCommonSearch(objectBreadthFirstSearch)
}

const testTreeBottomUpSearch = async (objectBottomUpSearch) => {
  const checkList = []
  strictEqual(
    await objectBottomUpSearch(
      TEST_NODE,
      ([ key, value, index, level ]) => checkList.push([ key, value, index, level ]) && false // to collect all
    ),
    undefined
  )
  stringifyEqual(checkList, [
    [ 'a0', 'a0', 0, 0 ],
    ...[
      [ 'b0', 'b0', 0, 1 ],
      [ 'b1', 'b1', 1, 1 ],
      ...[
        [ 'c0', 'c0', 0, 2 ],
        [ 'c1', 'c1', 1, 2 ],
        [ 'c2', 'c2', 2, 2 ],
        [ 'c3', 'c3', 3, 2 ]
      ],
      [ 'bDIVIDE', TEST_OBJECT.aDIVIDE.bDIVIDE, 2, 1 ], // [ 'b2', 'b2', 2, 1 ],
      [ 'b3', 'b3', 3, 1 ]
    ],
    [ 'aDIVIDE', TEST_OBJECT.aDIVIDE, 1, 0 ], // [ 'a1', 'a1', 1, 0 ],
    [ 'a2', 'a2', 2, 0 ],
    [ 'a3', 'a3', 3, 0 ]
  ])

  await testTreeCommonSearch(objectBottomUpSearch)
}

describe('Common.Data.Tree', () => {
  it('createTreeDepthFirstSearch()', async () => {
    await testTreeDepthFirstSearch(
      createTreeDepthFirstSearch(TEST_GET_SUB_NODE_LIST_FUNC)
    )
  })

  it('createTreeDepthFirstSearchAsync()', async () => {
    await testTreeDepthFirstSearch(
      createTreeDepthFirstSearchAsync(TEST_GET_SUB_NODE_LIST_FUNC)
    )
  })

  it('createTreeBreadthFirstSearch()', async () => {
    await testTreeBreadthFirstSearch(
      createTreeBreadthFirstSearch(TEST_GET_SUB_NODE_LIST_FUNC)
    )
  })

  it('createTreeBreadthFirstSearchAsync()', async () => {
    await testTreeBreadthFirstSearch(
      createTreeBreadthFirstSearchAsync(TEST_GET_SUB_NODE_LIST_FUNC)
    )
  })

  it('createTreeBottomUpSearch()', async () => {
    await testTreeBottomUpSearch(
      createTreeBottomUpSearch(TEST_GET_SUB_NODE_LIST_FUNC)
    )
  })

  it('createTreeBottomUpSearchAsync()', async () => {
    await testTreeBottomUpSearch(
      createTreeBottomUpSearchAsync(TEST_GET_SUB_NODE_LIST_FUNC)
    )
  })
})
