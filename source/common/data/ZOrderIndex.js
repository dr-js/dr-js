/**
 * check https://en.wikipedia.org/wiki/Z-order_curve
 * a 2D indexing method "maps multidimensional data to one dimension while preserving locality of the data points"
 */

class ZOrderIndex {
  constructor (order) {
    if (order < 1 || order > 16) throw new Error('[ZOrderIndex] order out of supported range')

    this.order = Math.floor(order)
    this.maxIndex = Math.pow(4, order) - 1
    this.maxXY = Math.pow(2, order) - 1
  }

  parseXY (x, y, quadList = []) {
    if (x < 0 || x > this.maxXY || y < 0 || y > this.maxXY) throw new Error('[parseXY] x, y out of range')

    quadList.length = this.order
    let zOrder = this.order

    while ((x !== 0 || y !== 0) && zOrder !== 0) {
      zOrder--
      quadList[ zOrder ] = ((y & 1) << 1) + (x & 1)
      x >>>= 1
      y >>>= 1
    }

    while (zOrder !== 0) {
      zOrder--
      quadList[ zOrder ] = 0
    }

    return this.parseQuadList(quadList)
  }

  getXY (zIndex, xyData = {}) {
    if (zIndex < 0 || zIndex > this.maxIndex) throw new Error('[getXY] zIndex out of range')
    let x = 0
    let y = 0

    while (zIndex !== 0) {
      y = (y << 1) + ((zIndex & 2) >>> 1)
      // y = (y << 1) + (zIndex & 2); // faster, but bit limit -1
      x = (x << 1) + (zIndex & 1)
      zIndex >>>= 2
    }

    xyData.x = x
    xyData.y = y
    // xyData.y = y >>> 1; // faster, but bit limit -1
    return xyData
  }

  parseQuadList (quadList) {
    if (quadList.length > this.order) throw new Error('[parseQuadList] quadList too long')

    let zIndex = 0
    let zOrder = quadList.length

    // first few quad
    for (let index = 0; index < zOrder; index++) {
      zIndex = (zIndex << 2) + quadList[ index ]
    }

    // add tail bit as quad = 0
    while (zOrder !== this.order) {
      zIndex <<= 2
      zOrder++
    }

    return zIndex >>> 0 // convert to unsigned 32
  }

  getQuadList (zIndex, quadList) {
    if (zIndex < 0 || zIndex > this.maxIndex) throw new Error('[getQuadList] zIndex out of range')

    if (quadList === undefined) quadList = []
    else quadList.length = 0

    while (zIndex !== 0) {
      quadList.unshift(zIndex & 3)
      zIndex >>>= 2
    }

    return quadList
  }
}

// fast method to Interleave bits, check: http://graphics.stanford.edu/~seander/bithacks.html#InterleaveBMN
const ZOrderIndex16 = {
  parseXY: (x, y) => {
    if (x < 0 || x > MAX_XY || y < 0 || y > MAX_XY) throw new Error('[parseXY] x, y out of range')
    // x, y are 16 bit data
    x = (x | (x << 8)) & MASK_3
    x = (x | (x << 4)) & MASK_2
    x = (x | (x << 2)) & MASK_1
    x = (x | (x << 1)) & MASK_0

    y = (y | (y << 8)) & MASK_3
    y = (y | (y << 4)) & MASK_2
    y = (y | (y << 2)) & MASK_1
    y = (y | (y << 1)) & MASK_0

    return (x | (y << 1)) >>> 0 // convert to unsigned 32
  },
  getXY: (zIndex, xyData = {}) => {
    if (zIndex < 0 || zIndex > MAX_INDEX) throw new Error('[getXY] zIndex out of range')
    let x = zIndex & MASK_0
    x = (x | (x >>> 1)) & MASK_1
    x = (x | (x >>> 2)) & MASK_2
    x = (x | (x >>> 4)) & MASK_3
    x = (x | (x >>> 8)) & MASK_4

    let y = (zIndex >>> 1) & MASK_0
    y = (y | (y >>> 1)) & MASK_1
    y = (y | (y >>> 2)) & MASK_2
    y = (y | (y >>> 4)) & MASK_3
    y = (y | (y >>> 8)) & MASK_4

    xyData.x = x
    xyData.y = y
    return xyData
  }
}

const ORDER = 16
const MAX_INDEX = Math.pow(4, ORDER) - 1
const MAX_XY = Math.pow(2, ORDER) - 1
const MASK_0 = 0x55555555 // 01010101 01010101 01010101 01010101
const MASK_1 = 0x33333333 // 00110011 00110011 00110011 00110011
const MASK_2 = 0x0f0f0f0f // 00001111 00001111 00001111 00001111
const MASK_3 = 0x00ff00ff // 00000000 11111111 00000000 11111111
const MASK_4 = 0x0000ffff // 00000000 00000000 11111111 11111111

export { ZOrderIndex, ZOrderIndex16 }
