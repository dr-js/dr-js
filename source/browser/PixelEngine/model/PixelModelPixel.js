import { Vector3, Color4 } from 'source/common/graphic'

class PixelModelPixel {
  constructor () {
    this.position = new Vector3()
    this.color = new Color4()
  }

  applyData (pixelPixelData) {
    // data apply logic
    this.position.fromArray(pixelPixelData.xyz)
    this.color.fromArray(pixelPixelData.rgba)
  }

  static loadData (pixelPixelData, loadedPixelPixel) {
    if (loadedPixelPixel === undefined) loadedPixelPixel = new PixelModelPixel()
    loadedPixelPixel.applyData(pixelPixelData)
    return loadedPixelPixel
  }
}

// const samplePixelPixelData = {
//   xyz: [ 0, 0, 0 ],
//   rgba: [ 0, 0, 0, 0 ]
// }

export {
  PixelModelPixel
}
