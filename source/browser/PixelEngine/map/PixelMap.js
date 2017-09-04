import { PixelMapChunk } from './PixelMapChunk'
import { PixelMapBlock } from './PixelMapBlock'

// Map serve as a data center for holding Chunks and Blocks
class PixelMap {
  constructor (id = -1, name = '') {
    this.id = id
    this.name = name
    this.blocks = [] // id - block
    this.chunks = [] // id - chunk
  }

  applyData ({ id, name, blocks, chunks }) {
    // data apply logic
    this.id = id
    this.name = name
    for (let index = 0, indexMax = blocks.length; index < indexMax; index++) {
      const block = PixelMapBlock.loadData(blocks[ index ])
      this.blocks[ block.id ] = block
    }
    for (let index = 0, indexMax = chunks.length; index < indexMax; index++) {
      const chunk = PixelMapChunk.loadData(chunks[ index ])
      this.chunks[ chunk.id ] = chunk
    }
  }

  static loadData (mapData, targetMap = new Map()) {
    targetMap.applyData(mapData)
    return targetMap
  }
}

// const sampleChunkData = {
//   id: 0,
//   name: 'A', // string, for debug marking
//   blocks: [],
//   chunks: [],
// }

export {
  PixelMap
}
