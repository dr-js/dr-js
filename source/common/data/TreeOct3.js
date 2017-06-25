import { Vector3, Box3 } from '../graphic'

// P for Positive, N for Negative, each for X, Y, Z
const OCTANT_INDEX_TYPE = {
  CROSS: -1, // cross-octants, or undefined for node
  PPP: 0,
  PPN: 1,
  PNP: 2,
  PNN: 3,
  NPP: 4,
  NPN: 5,
  NNP: 6,
  NNN: 7
}

function removeInArray (array, data) {
  const index = array.indexOf(data)
  if (index !== -1) {
    array.splice(index, 1)
    return true
  }
  return false
}

// directionInvert = 1 / ray.direction
function intersectsRay (box, origin, directionInvert) {
  let tmin, tmax, tymin, tymax, tzmin, tzmax
  if (directionInvert.x >= 0) {
    tmin = (box.min.x - origin.x) * directionInvert.x
    tmax = (box.max.x - origin.x) * directionInvert.x
  } else {
    tmin = (box.max.x - origin.x) * directionInvert.x
    tmax = (box.min.x - origin.x) * directionInvert.x
  }
  if (directionInvert.y >= 0) {
    tymin = (box.min.y - origin.y) * directionInvert.y
    tymax = (box.max.y - origin.y) * directionInvert.y
  } else {
    tymin = (box.max.y - origin.y) * directionInvert.y
    tymax = (box.min.y - origin.y) * directionInvert.y
  }
  if (tmin > tymax || tymin > tmax) return false
  // These lines also handle the case where tmin or tmax is NaN
  // (result of 0 * Infinity).
  if (tymin > tmin || isNaN(tmin)) tmin = tymin
  if (tymax < tmax || isNaN(tmax)) tmax = tymax
  if (directionInvert.z >= 0) {
    tzmin = (box.min.z - origin.z) * directionInvert.z
    tzmax = (box.max.z - origin.z) * directionInvert.z
  } else {
    tzmin = (box.max.z - origin.z) * directionInvert.z
    tzmax = (box.min.z - origin.z) * directionInvert.z
  }
  if (tmin > tzmax || tzmin > tmax) return false
  // if (tzmin > tmin || isNaN(tmin)) tmin = tzmin;
  if (tzmax < tmax || isNaN(tmax)) tmax = tzmax
  if (tmax < 0) return false // needed for NaN check
  return true
}

class TreeOct3 {
  constructor (config, center, radius) {
    this.config = config || { PENDING_DATA_MAX: 8, LOCK_UPDATE: false } // single reference for the entire tree
    this.dataMap = new Map()

    this.dataMap = {} // all data
    this.dataListRoot = [] // data under root
    this.dataListOutOfBound = [] // data out of root interval

    this.root = new TreeOct3Node(Dr.generateId(), this.config, OCTANT_INDEX_TYPE.CROSS, center, radius)
    this.rootOutOfBound = {
      ROOT_OUT_OF_BOUND: 'ROOT_OUT_OF_BOUND',
      parent: null,
      removeData () {}
    }
  }

  addData (data) {
    if (!this.dataMap.has(data.id)) {
      this.dataMap.set(data.id, data)

      if (this.root.box.containsBox(data.box)) {
        this.dataListRoot.push(data)

        this.root.addData(data)

        // DEBUG check
        data.node.checkValidData(data)
      } else {
        // out of bound
        this.dataListOutOfBound.push(data)

        data.node = this.rootOutOfBound
        data.octantIndex = OCTANT_INDEX_TYPE.CROSS
        // this.root.checkExpand(); // TODO: needed?
      }
    }
  }

  removeData (data) {
    if (this.dataMap.has(data.id)) {
      this.dataMap.delete(data.id)

      if (this.root.box.containsBox(data.box)) {
        removeInArray(this.dataListRoot, data)

        this.root.removeData(data)
      } else {
        // out of bound
        removeInArray(this.dataListOutOfBound, data)

        data.node = null
        data.octantIndex = OCTANT_INDEX_TYPE.CROSS
        // this.root.checkShrink(); // TODO: needed?
      }
    }
  }

  update () {
    // data geometry should update finished for current frame
    // this will pick changed data, reinsert for proper node
    const dataListRoot = this.dataListRoot
    const dataListOutOfBound = this.dataListOutOfBound

    const changeDataListRootRemove = [] // root remove, for out of bound
    const changeDataListRootAdd = [] // root add
    const changeDataListLocalUnstuck = [] // local operation: unstuck, move down to child

    let debugDataSum = dataListRoot.length + dataListOutOfBound.length

    // picking from dataListRoot, no node operation yet(except local pending -> stuck)
    for (let index = 0, indexMax = dataListRoot.length; index < indexMax; index++) {
      const data = dataListRoot[ index ]
      if (data.node.box.containsBox(data.box) === false) {
        // these are leaf node changes(remove & re-add), may cause shrink, split

        if (this.root.box.containsBox(data.box) === false) {
          changeDataListRootRemove.push(data)

          data.__DEBUG_NOTE = '[locked] out of bound'
        } else {
          changeDataListRootAdd.push(data)

          data.__DEBUG_NOTE = '[locked] root add'
        }
      } else {
        let lastOctantIndex = data.octantIndex
        data.octantIndex = data.node.getOctantIndex(data.box)
        if (lastOctantIndex === OCTANT_INDEX_TYPE.CROSS && data.octantIndex !== OCTANT_INDEX_TYPE.CROSS) {
          // a stuck data now fit for child node, may cause split

          changeDataListLocalUnstuck.push(data)

          data.__DEBUG_NOTE = '[locked] local unstuck'
        } else if (lastOctantIndex !== OCTANT_INDEX_TYPE.CROSS && data.octantIndex === OCTANT_INDEX_TYPE.CROSS) {
          // a leaf node pending data now stuck, no structural change (data sum stable)

          removeInArray(data.node.pendingDataList, data)
          data.node.stuckDataList.push(data)

          // DEBUG check
          data.node.checkValidData(data)
          data.__DEBUG_NOTE = '[update] local stuck'
        }
      }
    }

    // remove changeDataListRootRemove from dataListRoot (data now under root out of bound)
    for (let index = 0, indexMax = changeDataListRootRemove.length, dataListIndex = 0; index < indexMax; index++) {
      const data = changeDataListRootRemove[ index ]
      while (data !== dataListRoot[ dataListIndex ]) {
        dataListIndex++
      }
      dataListRoot.splice(dataListIndex, 1)
    }

    if (debugDataSum !== dataListRoot.length + dataListOutOfBound.length + changeDataListRootRemove.length) {
      throw new Error('[update] data sum mismatch!')
    }

    // picking from dataListOutOfBound
    for (let index = 0, indexMax = dataListOutOfBound.length; index < indexMax; index++) {
      const data = dataListOutOfBound[ index ]
      if (this.root.box.containsBox(data.box) === false) {
        // still out of bound

        changeDataListRootRemove.push(data)

        data.__DEBUG_NOTE = '[locked] still out of bound'
      } else {
        // now in bound

        changeDataListRootAdd.push(data)

        // add under root
        dataListRoot.push(data)

        data.__DEBUG_NOTE = '[locked] in bound root add'
      }
    }

    // clear dataListOutOfBound, will re-push
    dataListOutOfBound.length = 0

    this.config.LOCK_UPDATE = true

    // remove from node, to out of bound
    for (let index = 0, indexMax = changeDataListRootRemove.length; index < indexMax; index++) {
      const data = changeDataListRootRemove[ index ]
      let node = data.node.parent
      while (node !== null) {
        // recursive remove parent dataSum
        node.dataSum--
        node = node.parent
      }

      data.node.removeData(data)

      dataListOutOfBound.push(data)
      data.node = this.rootOutOfBound
      data.octantIndex = OCTANT_INDEX_TYPE.CROSS

      // DEBUG check
      data.__DEBUG_NOTE = '[update] out of bound'
    }

    // remove from node add to root (two step to prevent 'shrink - split' when dirty data mixed in node)
    for (let index = 0, indexMax = changeDataListRootAdd.length; index < indexMax; index++) {
      const data = changeDataListRootAdd[ index ]
      let node = data.node.parent
      while (node !== null) {
        // remove parent data count, stop at root (parent === null)
        node.dataSum--
        node = node.parent
      }

      data.node.removeData(data)

      // DEBUG check
      data.__DEBUG_NOTE = '[update] root add (step remove)'
    }
    for (let index = 0, indexMax = changeDataListRootAdd.length; index < indexMax; index++) {
      const data = changeDataListRootAdd[ index ]

      this.root.addData(data)

      // DEBUG check
      data.node.checkValidData(data)
      data.__DEBUG_NOTE = '[update] root add'
    }

    this.config.LOCK_UPDATE = false

    // local operation
    for (let index = 0, indexMax = changeDataListLocalUnstuck.length; index < indexMax; index++) {
      const data = changeDataListLocalUnstuck[ index ]

      // during upper operation, this may be already unstuck in a split operation
      if (removeInArray(data.node.stuckDataList, data)) {
        data.node.dataSum--
        data.node.addData(data)
      }

      // DEBUG check
      data.node.checkValidData(data)
      data.__DEBUG_NOTE = '[update] local unstuck'
    }

    if (debugDataSum !== dataListRoot.length + dataListOutOfBound.length) {
      throw new Error('[update] data sum mismatch!')
    }
  }

  // will check onHit(data) for is proceed, hit data is depth-first
  queryBox (onHit, box) {
    this.root.queryBox(onHit, box)
  }

  // will check onHit(data) for is proceed, hit data is near-first
  queryRay (onHit, ray) {
    const directionInvert = new Vector3(1, 1, 1)
    directionInvert.divide(ray.direction)
    this.root.queryRay(onHit, ray.origin, directionInvert)
  }

  checkValid () {
    this.root.parent = { children: [] }
    this.root.parent.children[ -1 ] = this.root
    this.root.checkValid()
    this.root.parent = null

    const rootNode = this.root
    const outOfBoundRootNode = this.rootOutOfBound
    const dataList = this.dataListRoot
    const outOfBoundDataList = this.dataListOutOfBound

    if (rootNode.dataSum !== dataList.length) {
      throw new Error('[checkValid] error data count!')
    }

    for (let index = 0, indexMax = dataList.length; index < indexMax; index++) {
      const data = dataList[ index ]
      if (data.node.parent === null && data.node !== rootNode) {
        throw new Error('[checkValid] error data.node!')
      }
    }

    for (let index = 0, indexMax = outOfBoundDataList.length; index < indexMax; index++) {
      const data = outOfBoundDataList[ index ]
      if (data.node !== outOfBoundRootNode) {
        throw new Error('[checkValid] error outOfBound data.node!')
      }
    }
  }

  getStatus () {
    const status = {
      dataSum: this.dataListOutOfBound.length + this.dataListRoot.length,
      rootDataSum: this.dataListRoot.length,
      outOfBoundDataSum: this.dataListOutOfBound.length,

      sumByDepthNode: [],
      sumByDepthStuckData: [],
      sumByDepthPendingData: []
    }

    this.root.getStatus(status)

    return status
  }
}

// inner class, should not direct access
class TreeOct3Node {
  constructor (id, config, octantIndex, center, radius) {
    this.id = id
    this.config = config
    this.octantIndex = octantIndex // relative to upper node
    this.center = center
    this.radius = radius

    this.parent = null

    // data may go either 1 of 3 ways:
    this.stuckDataList = [] // cross-octants AABBs
    this.pendingDataList = [] // pending for split data list, deleted after split
    this.children = null // index using octantIndex, created after split

    this.dataSum = 0 // this node and all below

    this.depth = 0 // root = 0

    this.box = new Box3()
    this.box.setFromCenterAndRadius(this.center, this.radius)
  }

  addData (data) {
    this.dataSum++

    const octantIndex = this.getOctantIndex(data.box)
    if (octantIndex === OCTANT_INDEX_TYPE.CROSS) {
      // DEBUG check
      if (this.stuckDataList.includes(data)) {
        throw new Error('[addData] data link error!')
      }

      // stuck at this level...
      this.stuckDataList.push(data)

      data.node = this
      data.octantIndex = OCTANT_INDEX_TYPE.CROSS // octantIndex;

      data.__DEBUG_NOTE = '[addData] stuck'
    } else {
      // can go down, check split status (leaf node will buffer 8 + data before split down)
      if (this.children !== null) {
        // split-ready node
        let child = this.children[ octantIndex ]
        if (child === undefined) {
          child = this.__createChild(octantIndex)
        }

        child.addData(data)
      } else {
        // DEBUG check
        if (this.pendingDataList.includes(data)) {
          throw new Error('[addData] data link error!')
        }

        // pending at this level, but soon will be a split...
        this.pendingDataList.push(data)

        data.node = this
        data.octantIndex = octantIndex

        this.checkSplit()
      }
    }
  }

  removeData (data) {
    this.dataSum--

    if (data.node !== this) {
      // not this node
      const child = this.children[ this.getOctantIndex(data.box) ]
      child.removeData(data)
      this.checkShrink()
    } else if (this.stuckDataList.length !== 0 && removeInArray(this.stuckDataList, data)) {
      data.node = null
      // data.octantIndex = OCTANT_INDEX_TYPE.CROSS;

      data.__DEBUG_NOTE = '[removeData]'

      this.checkShrink()
    } else if (this.pendingDataList !== null && removeInArray(this.pendingDataList, data)) {
      data.node = null
      // data.octantIndex = OCTANT_INDEX_TYPE.CROSS;

      data.__DEBUG_NOTE = '[removeData]'

      // this.checkShrink(); // not possible, no child node
    } else {
      // DEBUG check
      throw new Error('[removeData] data link error!')
    }
  }

  getOctantIndex (box) {
    // box should already in this.box
    // check which octant is hit
    const boxMin = box.min
    const boxMax = box.max
    const center = this.center

    if ((boxMin.x < center.x && boxMax.x > center.x) || (boxMin.y < center.y && boxMax.y > center.y) || (boxMin.z < center.z && boxMax.z > center.z)) {
      return OCTANT_INDEX_TYPE.CROSS // stuck case
    } else {
      let octantIndex = 0
      octantIndex += boxMin.x >= center.x ? 0 : 4
      octantIndex += boxMin.y >= center.y ? 0 : 2
      octantIndex += boxMin.z >= center.z ? 0 : 1
      return octantIndex
    }
  }

  checkSplit () {
    if (this.pendingDataList.length > this.config.PENDING_DATA_MAX) {
      this.__split()
    }
  }

  checkExpand () {}

  checkShrink () {
    if (this.dataSum <= this.config.PENDING_DATA_MAX && this.children !== null) {
      this.__shrink()
    }
  }

  // will check hitCallback(data) for is proceed, hit data is depth-first
  queryBox (onHit, box) {
    // first check stuck data
    const stuckDataList = this.stuckDataList
    for (let index = 0, indexMax = stuckDataList.length; index < indexMax; index++) {
      const data = stuckDataList[ index ]
      if (box.intersectsBox(data.box) && onHit(data) === false) {
        return
      }
    }

    // then check pending
    const pendingDataList = this.pendingDataList
    if (pendingDataList !== null) {
      for (let index = 0, indexMax = pendingDataList.length; index < indexMax; index++) {
        const data = pendingDataList[ index ]
        if (box.intersectsBox(data.box) && onHit(data) === false) {
          return
        }
      }
    }

    // then check down if possible
    const childList = this.children
    if (childList !== null) {
      const boxOctantIndex = this.getOctantIndex(box)
      if (boxOctantIndex !== OCTANT_INDEX_TYPE.CROSS) {
        // lucky to query on child only
        const child = childList[ boxOctantIndex ]
        if (child !== undefined) {
          child.queryBox(onHit, box)
        }
      } else {
        // may have to query all child
        for (let octantIndex = 0, indexMax = childList.length; octantIndex < indexMax; octantIndex++) {
          const child = childList[ octantIndex ]
          if (child !== undefined && box.intersectsBox(child.box)) {
            child.queryBox(onHit, box)
          }
        }
      }
    }
  }

  // will check hitCallback(data) for is proceed, hit data is depth-first
  queryRay (onHit, origin, directionInvert) {
    // first check stuck data
    const stuckDataList = this.stuckDataList
    for (let index = 0, indexMax = stuckDataList.length; index < indexMax; index++) {
      const data = stuckDataList[ index ]
      if (intersectsRay(data.box, origin, directionInvert) && onHit(data) === false) {
        return
      }
    }

    // then check pending
    const pendingDataList = this.pendingDataList
    if (pendingDataList !== null) {
      for (let index = 0, indexMax = pendingDataList.length; index < indexMax; index++) {
        const data = pendingDataList[ index ]
        if (intersectsRay(data.box, origin, directionInvert) && onHit(data) === false) {
          return
        }
      }
    }

    // then check down if possible
    const childList = this.children
    if (childList !== null) {
      // may have to query all child
      for (let octantIndex = 0, indexMax = childList.length; octantIndex < indexMax; octantIndex++) {
        const child = childList[ octantIndex ]
        if (child !== undefined && intersectsRay(child.box, origin, directionInvert)) {
          child.queryRay(onHit, origin, directionInvert)
        }
      }
    }
  }

  checkValid () {
    if (this.parent === null) {
      throw new Error('[checkValid] no parent node!')
    }
    if (this.parent.children[ this.octantIndex ] !== this) {
      throw new Error('[checkValid] error parent octantIndex!')
    }

    const childList = this.children
    const stuckDataList = this.stuckDataList
    const pendingDataList = this.pendingDataList

    let childDataSum = 0
    let stuckDataCount = 0
    let pendingDataCount = 0

    if (childList !== null) {
      for (let octantIndex = 0, indexMax = childList.length; octantIndex < indexMax; octantIndex++) {
        const child = childList[ octantIndex ]
        if (child !== undefined) {
          child.checkValid()
          childDataSum += child.dataSum
        }
      }
    }

    stuckDataCount = stuckDataList.length
    for (let index = 0, indexMax = stuckDataList.length; index < indexMax; index++) {
      const data = stuckDataList[ index ]
      this.checkValidData(data)
    }

    if (pendingDataList !== null) {
      pendingDataCount = pendingDataList.length
      for (let index = 0, indexMax = pendingDataList.length; index < indexMax; index++) {
        const data = pendingDataList[ index ]
        this.checkValidData(data)
      }
    }

    if (this.dataSum !== childDataSum + stuckDataCount + pendingDataCount) {
      throw new Error('[checkValid] data sum mismatch!')
    }
  }

  checkValidData (data) {
    if (this.box.containsBox(data.box) === false) {
      throw new Error('[checkValidData] data box out of bound!')
    }
    if (data.node !== this) {
      throw new Error('[checkValidData] data node mismatch!')
    }
    if (this.children !== null && data.octantIndex !== this.getOctantIndex(data.box)) {
      throw new Error('[checkValidData] branch node data octantIndex mismatch!')
    }
  }

  getStatus (status) {
    status.sumByDepthNode[ this.depth ] = (status.sumByDepthNode[ this.depth ] || 0) + 1

    status.sumByDepthStuckData[ this.depth ] = (status.sumByDepthStuckData[ this.depth ] || 0) + this.stuckDataList.length

    if (this.pendingDataList !== null) {
      status.sumByDepthPendingData[ this.depth ] = (status.sumByDepthPendingData[ this.depth ] || 0) + this.pendingDataList.length
    }

    const childList = this.children
    if (childList !== null) {
      for (let octantIndex = 0, indexMax = childList.length; octantIndex < indexMax; octantIndex++) {
        const child = childList[ octantIndex ]
        if (child !== undefined) {
          child.getStatus(status)
        }
      }
    }
  }

  // only one level down, will create some child
  __split () {
    // DEBUG check
    if (this.children !== null || this.pendingDataList === null) {
      throw new Error('[__split] node structure error!')
    }

    const pendingDataList = this.pendingDataList
    this.pendingDataList = null
    this.children = []

    for (let index = 0, indexMax = pendingDataList.length; index < indexMax; index++) {
      const data = pendingDataList[ index ]
      const octantIndex = data.octantIndex // this.getOctantIndex(data.box);

      if (this.config.LOCK_UPDATE === false && octantIndex !== this.getOctantIndex(data.box)) {
        throw new Error('[__split] data octantIndex outdated!')
      }

      let child = this.children[ octantIndex ]
      if (child === undefined) {
        child = this.__createChild(octantIndex)
      }

      child.addData(data)

      data.__DEBUG_NOTE = '[__split]'
    }
  }

  __expand () {}

  // only one level up, all child should be leaf node
  __shrink () {
    if (this.pendingDataList !== null || this.children === null) {
      throw new Error('[__shrink] node structure error!')
    }

    const pendingDataList = []
    const childList = this.children
    for (let octantIndex = 0, indexMax = childList.length; octantIndex < indexMax; octantIndex++) {
      const child = childList[ octantIndex ]
      if (child !== undefined) {
        if (child.children !== null) {
          child.__shrink()
        }

        // in place concat
        // NOTE: during tree update, some data may be out of bound
        pendingDataList.push.apply(pendingDataList, child.pendingDataList)
        pendingDataList.push.apply(pendingDataList, child.stuckDataList)

        this.__removeChild(octantIndex)
      }
    }

    this.children = null

    // update data info
    for (let index = 0, indexMax = pendingDataList.length; index < indexMax; index++) {
      const data = pendingDataList[ index ]
      data.node = this
      data.octantIndex = this.getOctantIndex(data.box)

      data.__DEBUG_NOTE = '[__shrink]'
    }

    this.pendingDataList = pendingDataList
  }

  // should check duplicate outside
  __createChild (octantIndex) {
    const cx = this.center.x
    const cy = this.center.y
    const cz = this.center.z
    const radius = this.radius * 0.5
    const center = new Vector3()

    switch (octantIndex) {
      case OCTANT_INDEX_TYPE.PPP:
        center.set(cx + radius, cy + radius, cz + radius)
        break
      case OCTANT_INDEX_TYPE.PPN:
        center.set(cx + radius, cy + radius, cz - radius)
        break
      case OCTANT_INDEX_TYPE.PNP:
        center.set(cx + radius, cy - radius, cz + radius)
        break
      case OCTANT_INDEX_TYPE.PNN:
        center.set(cx + radius, cy - radius, cz - radius)
        break
      case OCTANT_INDEX_TYPE.NPP:
        center.set(cx - radius, cy + radius, cz + radius)
        break
      case OCTANT_INDEX_TYPE.NPN:
        center.set(cx - radius, cy + radius, cz - radius)
        break
      case OCTANT_INDEX_TYPE.NNP:
        center.set(cx - radius, cy - radius, cz + radius)
        break
      case OCTANT_INDEX_TYPE.NNN:
        center.set(cx - radius, cy - radius, cz - radius)
        break
      default:
        throw new Error('error octantIndex', octantIndex)
    }
    const child = new this.constructor(Dr.generateId(), this.config, octantIndex, center, radius)
    this.children[ octantIndex ] = child
    child.parent = this
    child.depth = this.depth + 1
    return child
  }

  // should check exist outside
  __removeChild (octantIndex) {
    const child = this.children[ octantIndex ]
    child.parent = null

    // DEBUG check
    if (child.children !== null) {
      throw new Error('[__removeChild] child not leaf node!')
    }

    // DEBUG check
    child.dataSum = -999

    this.children[ octantIndex ] = undefined
    return child
  }
}

// inner class, should not direct access, used for sample
class TreeOct3Data {
  constructor (id, box) {
    this.id = id || Dr.generateId()
    this.box = box || new Box3()

    // mark data for octree
    this.node = null
    this.octantIndex = -1
  }

  update () {}// sync box min max
}

export { TreeOct3, TreeOct3Node, TreeOct3Data }
