import { stringifyEqual } from 'source/common/verify.js'

import {
  createPatchKit,
  toObjectPatchKit,
  toArrayWithKeyPatchKit
} from './Patch.js'

const { describe, it } = global

describe('source/common/module/Patch', () => {
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
      stringifyEqual(hasObjectPatch(objectA, objectA), false)
      stringifyEqual(hasObjectPatch(objectB, objectB), false)
      stringifyEqual(hasObjectPatch(objectC, objectC), false)
      stringifyEqual(hasObjectPatch(objectA, objectB), true)
      stringifyEqual(hasObjectPatch(objectA, objectC), true)
      stringifyEqual(hasObjectPatch(objectB, objectA), true)
      stringifyEqual(hasObjectPatch(objectB, objectC), true)
      stringifyEqual(hasObjectPatch(objectC, objectA), true)
      stringifyEqual(hasObjectPatch(objectC, objectB), true)
    })

    it('countObjectPatch', () => {
      stringifyEqual(countObjectPatch(objectA, objectA), 0)
      stringifyEqual(countObjectPatch(objectB, objectB), 0)
      stringifyEqual(countObjectPatch(objectC, objectC), 0)
      stringifyEqual(countObjectPatch(objectA, objectB), 4)
      stringifyEqual(countObjectPatch(objectA, objectC), 2)
      stringifyEqual(countObjectPatch(objectB, objectA), 4)
      stringifyEqual(countObjectPatch(objectB, objectC), 4)
      stringifyEqual(countObjectPatch(objectC, objectA), 2)
      stringifyEqual(countObjectPatch(objectC, objectB), 4)
    })

    it('generateObjectPatch/applyObjectPatch', () => {
      const objectPatchSame = generateObjectPatch(objectA, objectA)

      stringifyEqual(objectPatchSame, {
        deleteList: [],
        updateList: []
      })

      const objectPatch = generateObjectPatch(objectB, objectA)

      stringifyEqual(objectPatch, {
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

      stringifyEqual(objectD, {
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
      stringifyEqual(hasArrayWithKeyPatch(arrayA, arrayA), false)
      stringifyEqual(hasArrayWithKeyPatch(arrayB, arrayB), false)
      stringifyEqual(hasArrayWithKeyPatch(arrayC, arrayC), false)
      stringifyEqual(hasArrayWithKeyPatch(arrayA, arrayB), true)
      stringifyEqual(hasArrayWithKeyPatch(arrayA, arrayC), true)
      stringifyEqual(hasArrayWithKeyPatch(arrayB, arrayA), true)
      stringifyEqual(hasArrayWithKeyPatch(arrayB, arrayC), true)
      stringifyEqual(hasArrayWithKeyPatch(arrayC, arrayA), true)
      stringifyEqual(hasArrayWithKeyPatch(arrayC, arrayB), true)
    })

    it('countArrayWithKeyPatch', () => {
      stringifyEqual(countArrayWithKeyPatch(arrayA, arrayA), 0)
      stringifyEqual(countArrayWithKeyPatch(arrayB, arrayB), 0)
      stringifyEqual(countArrayWithKeyPatch(arrayC, arrayC), 0)
      stringifyEqual(countArrayWithKeyPatch(arrayA, arrayB), 4)
      stringifyEqual(countArrayWithKeyPatch(arrayA, arrayC), 2)
      stringifyEqual(countArrayWithKeyPatch(arrayB, arrayA), 4)
      stringifyEqual(countArrayWithKeyPatch(arrayB, arrayC), 4)
      stringifyEqual(countArrayWithKeyPatch(arrayC, arrayA), 2)
      stringifyEqual(countArrayWithKeyPatch(arrayC, arrayB), 4)
    })

    it('generateArrayWithKeyPatch/applyArrayWithKeyPatch', () => {
      const arrayPatchSame = generateArrayWithKeyPatch(arrayA, arrayA)

      stringifyEqual(arrayPatchSame, {
        deleteList: [],
        updateList: []
      })

      const arrayPatch = generateArrayWithKeyPatch(arrayB, arrayA)

      stringifyEqual(arrayPatch, {
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

      stringifyEqual(arrayD, [
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
