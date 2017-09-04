import { Vector3, Box3, Quaternion, Matrix4 } from 'source/common/graphic'
import { PixelModelPixel } from './PixelModelPixel'

class PixelModelPart {
  constructor () {
    this.position = new Vector3()
    this.rotation = new Quaternion()

    this.isVisible = true

    this.name = '' // PixelPart name
    this.pixels = [] // PixelModelPixel list

    this.transformMatrix = new Matrix4()
    this.aabb = new Box3()
  }

  updateTransformMatrix () {
    this.transformMatrix.makeRotationFromQuaternion(this.rotation)
    this.transformMatrix.setPosition(this.position)
  }

  updateAABB () {
    this.aabb.makeEmpty()

    const pixelList = this.pixels
    for (let index = 0, indexMax = pixelList.length; index < indexMax; index++) {
      this.aabb.expandByPoint(pixelList[ index ].position)
    }

    this.aabb.min.add(this.position)
    this.aabb.max.add(this.position)
  }

  applyData (pixelPartData) {
    // data apply logic
    this.name = pixelPartData.name
    this.position.fromArray(pixelPartData.xyz)
    this.rotation.fromArray(pixelPartData.xyzw)

    const pixelList = this.pixels
    const dataPixelList = pixelPartData.pixels
    for (let index = 0, indexMax = dataPixelList.length; index < indexMax; index++) {
      pixelList.push(PixelModelPixel.loadData(dataPixelList[ index ]))
    }
    this.updateAABB()
  }

  static loadData (pixelPartData, loadedPixelPart) {
    if (loadedPixelPart === undefined) loadedPixelPart = new PixelModelPart()
    loadedPixelPart.applyData(pixelPartData)
    return loadedPixelPart
  }
}

// const samplePixelPartData = {
//   name: 'A', // string, for PixelBone attaching
//   xyz: [ 0, 0, 0 ],
//   xyzw: [ 0, 0, 0, 0 ],
//   pixels: [ '{PixelModelPixel}' ]
// }

export {
  PixelModelPart
}
