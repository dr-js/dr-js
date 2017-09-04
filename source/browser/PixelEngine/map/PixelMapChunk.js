import { PixelMapBlock } from './PixelMapBlock'

class PixelMapChunk {
  constructor (id = -1, name = '') {
    this.id = id
    this.name = name
    this.blockIds = [] // block id only
  }

  applyData ({ id, name, blockIdList }) {
    // data apply logic
    this.id = id
    this.name = name
    this.blockIds.push.apply(this.blockIds, blockIdList) // copy
  }

  static loadData (chunkData, loadedChunk) {
    if (loadedChunk === undefined) loadedChunk = new PixelMapBlock()
    loadedChunk.applyData(chunkData)
    return loadedChunk
  }
}

// const sampleChunkData = {
//   id: 0,
//   name: 'A', // string, for debug marking
//   blockIdList: [ 0, 1, 2 ]
// }

export {
  PixelMapChunk
}
