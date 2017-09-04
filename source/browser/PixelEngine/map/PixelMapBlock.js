import { PixelModelPixel } from '../model'

const BLOCK_RADIUS = 8
const BLOCK_DIAMETER = BLOCK_RADIUS * 2
const BLOCK_SIZE = BLOCK_DIAMETER * BLOCK_DIAMETER * BLOCK_DIAMETER

// Block data is a 16x16x16 sized pixel cube.
// the data is intended to be used as templates

class PixelMapBlock {
  constructor (id = -1, name = '') {
    this.id = id
    this.name = name
    this.pixels = [] // PixelModelPixel list
  }

  applyData ({ id, name, pixels }) {
    // data apply logic
    this.id = id
    this.name = name

    for (let index = 0, indexMax = pixels.length; index < indexMax; index++) {
      this.pixels.push(PixelModelPixel.loadData(pixels[ index ]))
    }
  }

  static loadData (blockData, loadedBlock = new PixelMapBlock()) {
    loadedBlock.applyData(blockData)
    return loadedBlock
  }
}

// const sampleBlockData = {
//   id: 0,
//   name: 'A', // string, for debug marking
//   pixels: [ '{PixelModelPixel}' ]
// }

export {
  PixelMapBlock,
  BLOCK_RADIUS,
  BLOCK_DIAMETER,
  BLOCK_SIZE
}
