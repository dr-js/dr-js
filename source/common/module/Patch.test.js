import { deepStrictEqual } from 'assert'

import {
  createPatchKit,
  toObjectPatchKit,
  toArrayWithKeyPatchKit
} from './Patch'

const { describe, it } = global

describe('source/V1/common/module/Patch', () => {
  const patchKit = createPatchKit({
    NAME_KEY: 'key',
    NAME_MODIFY_TIME: 'mtime'
  })

  describe('ObjectPatch', () => {
    const {
      hasObjectPatch,
      countObjectPatch,
      generateObjectPatch,
      applyObjectPatch
    } = toObjectPatchKit(patchKit)

    const objectA = {
      '0': { key: '0', mtime: 0 },
      '1': { key: '1', mtime: 0 },
      '2': { key: '2', mtime: 0 },
      '3': { key: '3', mtime: 0 },
      '4': { key: '4', mtime: 0 },
      '5': { key: '5', mtime: 0 }
    }

    const objectB = {
      '0': objectA[ '0' ],
      '1': { key: '1', mtime: 1, update: 'update' },
      '2': { key: '2', mtime: 1, update: 'update-stale' },
      // '3': objectA[ '3' ], // delete
      // '4': objectA[ '4' ], // delete stale
      '5': objectA[ '5' ]
    }

    const objectC = {
      '0': { key: '0', mtime: 0 },
      '1': { key: '1', mtime: 0 },
      '2': { key: '2', mtime: 2 }, // mark stale
      '3': { key: '3', mtime: 0 },
      '4': { key: '4', mtime: 2 }, // mark stale
      '5': { key: '5', mtime: 0 }
    }

    it('hasObjectPatch', () => {
      deepStrictEqual(hasObjectPatch(objectA, objectA), false)
      deepStrictEqual(hasObjectPatch(objectB, objectB), false)
      deepStrictEqual(hasObjectPatch(objectC, objectC), false)
      deepStrictEqual(hasObjectPatch(objectA, objectB), true)
      deepStrictEqual(hasObjectPatch(objectA, objectC), true)
      deepStrictEqual(hasObjectPatch(objectB, objectA), true)
      deepStrictEqual(hasObjectPatch(objectB, objectC), true)
      deepStrictEqual(hasObjectPatch(objectC, objectA), true)
      deepStrictEqual(hasObjectPatch(objectC, objectB), true)
    })

    it('countObjectPatch', () => {
      deepStrictEqual(countObjectPatch(objectA, objectA), 0)
      deepStrictEqual(countObjectPatch(objectB, objectB), 0)
      deepStrictEqual(countObjectPatch(objectC, objectC), 0)
      deepStrictEqual(countObjectPatch(objectA, objectB), 4)
      deepStrictEqual(countObjectPatch(objectA, objectC), 2)
      deepStrictEqual(countObjectPatch(objectB, objectA), 4)
      deepStrictEqual(countObjectPatch(objectB, objectC), 4)
      deepStrictEqual(countObjectPatch(objectC, objectA), 2)
      deepStrictEqual(countObjectPatch(objectC, objectB), 4)
    })

    it('generateObjectPatch/applyObjectPatch', () => {
      const objectPatchSame = generateObjectPatch(objectA, objectA)

      deepStrictEqual(objectPatchSame, {
        deleteList: [],
        updateList: []
      })

      const objectPatch = generateObjectPatch(objectB, objectA)

      deepStrictEqual(objectPatch, {
        deleteList: [
          { key: '3', mtime: 0 },
          { key: '4', mtime: 0 }
        ],
        updateList: [
          { key: '1', mtime: 1, update: 'update' },
          { key: '2', mtime: 1, update: 'update-stale' }
        ]
      })

      const objectD = applyObjectPatch(objectC, objectPatch)

      deepStrictEqual(objectD, {
        '0': { key: '0', mtime: 0 },
        '1': { key: '1', mtime: 1, update: 'update' },
        '2': { key: '2', mtime: 2 },
        // delete
        '4': { key: '4', mtime: 2 }, // delete stale
        '5': { key: '5', mtime: 0 }
      })
    })
  })

  describe('ArrayWithKeyPatch', () => {
    const {
      hasArrayWithKeyPatch,
      countArrayWithKeyPatch,
      generateArrayWithKeyPatch,
      applyArrayWithKeyPatch
    } = toArrayWithKeyPatchKit(patchKit)

    const arrayA = [
      { key: '0', mtime: 0 },
      { key: '1', mtime: 0 },
      { key: '2', mtime: 0 },
      { key: '3', mtime: 0 },
      { key: '4', mtime: 0 },
      { key: '5', mtime: 0 }
    ]

    const arrayB = [
      arrayA[ 0 ],
      { key: '1', mtime: 1, update: 'update' },
      { key: '2', mtime: 1, update: 'update-stale' },
      // arrayA[ 3 ], // delete
      // arrayA[ 4 ], // delete stale
      arrayA[ 5 ]
    ]

    const arrayC = [
      { key: '0', mtime: 0 },
      { key: '1', mtime: 0 },
      { key: '2', mtime: 2 }, // mark stale
      { key: '3', mtime: 0 },
      { key: '4', mtime: 2 }, // mark stale
      { key: '5', mtime: 0 }
    ]

    it('hasArrayWithKeyPatch', () => {
      deepStrictEqual(hasArrayWithKeyPatch(arrayA, arrayA), false)
      deepStrictEqual(hasArrayWithKeyPatch(arrayB, arrayB), false)
      deepStrictEqual(hasArrayWithKeyPatch(arrayC, arrayC), false)
      deepStrictEqual(hasArrayWithKeyPatch(arrayA, arrayB), true)
      deepStrictEqual(hasArrayWithKeyPatch(arrayA, arrayC), true)
      deepStrictEqual(hasArrayWithKeyPatch(arrayB, arrayA), true)
      deepStrictEqual(hasArrayWithKeyPatch(arrayB, arrayC), true)
      deepStrictEqual(hasArrayWithKeyPatch(arrayC, arrayA), true)
      deepStrictEqual(hasArrayWithKeyPatch(arrayC, arrayB), true)
    })

    it('countArrayWithKeyPatch', () => {
      deepStrictEqual(countArrayWithKeyPatch(arrayA, arrayA), 0)
      deepStrictEqual(countArrayWithKeyPatch(arrayB, arrayB), 0)
      deepStrictEqual(countArrayWithKeyPatch(arrayC, arrayC), 0)
      deepStrictEqual(countArrayWithKeyPatch(arrayA, arrayB), 4)
      deepStrictEqual(countArrayWithKeyPatch(arrayA, arrayC), 2)
      deepStrictEqual(countArrayWithKeyPatch(arrayB, arrayA), 4)
      deepStrictEqual(countArrayWithKeyPatch(arrayB, arrayC), 4)
      deepStrictEqual(countArrayWithKeyPatch(arrayC, arrayA), 2)
      deepStrictEqual(countArrayWithKeyPatch(arrayC, arrayB), 4)
    })

    it('generateArrayWithKeyPatch/applyArrayWithKeyPatch', () => {
      const arrayPatchSame = generateArrayWithKeyPatch(arrayA, arrayA)

      deepStrictEqual(arrayPatchSame, {
        deleteList: [],
        updateList: []
      })

      const arrayPatch = generateArrayWithKeyPatch(arrayB, arrayA)

      deepStrictEqual(arrayPatch, {
        deleteList: [
          { key: '3', mtime: 0 },
          { key: '4', mtime: 0 }
        ],
        updateList: [
          { key: '1', mtime: 1, update: 'update' },
          { key: '2', mtime: 1, update: 'update-stale' }
        ]
      })

      const arrayD = applyArrayWithKeyPatch(arrayC, arrayPatch)

      deepStrictEqual(arrayD, [
        { key: '0', mtime: 0 },
        { key: '1', mtime: 1, update: 'update' },
        { key: '2', mtime: 2 },
        // delete
        { key: '4', mtime: 2 }, // delete stale
        { key: '5', mtime: 0 }
      ])
    })
  })
})
