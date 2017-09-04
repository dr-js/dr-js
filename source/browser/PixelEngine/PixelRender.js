import { Vector3, Matrix4, Ray3 } from 'source/common/graphic'

class PixelRender {
  constructor () {
    this.canvas = null
    this.canvasContext = null

    // the scale for transferring working pixel to output pixel
    // a 2.0 pixelScale meaning a 2 x 2 box for 1 working pixel
    // a 0.5 pixelScale meaning a 1 x 1 box for 4 working pixel, resulting in pixel merging
    this.pixelScale = 1

    // the output buffer(same size as canvas)
    this.outputWidth = 0
    this.outputHeight = 0
    this.outputImageBuffer = null

    // the working buffer(used for rendering)
    this.workingWidth = 0
    this.workingHeight = 0
    this.workingImageBuffer = null
    this.workingDepthBuffer = null // for overlap decision(Z buffer)

    // pre calculated mapper for output pixel index -> working pixel index
    this.quickOutputWorkingIndexMap = null
  }

  init (canvas, pixelScale, width, height) {
    this.canvas = canvas
    this.canvasContext = this.canvas.getContext('2d')

    // calculate output/working buffer
    this.resize(pixelScale, width, height)

    console.log('[PixelRender][Init] pixelScale: ' + this.pixelScale + ' | outputSize: ' + this.outputWidth + ' x ' + this.outputHeight + ' | workingSize: ' + this.workingWidth + ' x ' + this.workingHeight)
  }

  // resize is a bit slow, don't do that often, also used in initialize
  resize (pixelScale, width, height) {
    this.pixelScale = pixelScale || this.pixelScale

    // output
    this.outputWidth = width || this.canvas.width
    this.outputHeight = height || this.canvas.height
    this.outputImageBuffer = this.canvasContext.getImageData(0, 0, this.outputWidth, this.outputHeight)
    this.outputImageBufferData = new Uint32Array(this.outputImageBuffer.data.buffer)

    __resetCanvasSize(this.canvas, this.outputWidth, this.outputHeight)

    // working
    this.workingWidth = Math.floor(this.outputWidth / this.pixelScale)
    this.workingHeight = Math.floor(this.outputHeight / this.pixelScale)
    this.halfWorkingWidth = Math.floor(this.workingWidth * 0.5)
    this.halfWorkingHeight = Math.floor(this.workingHeight * 0.5)
    this.workingImageBuffer = this.canvasContext.createImageData(this.workingWidth, this.workingHeight)
    this.workingImageBufferData = new Uint32Array(this.workingImageBuffer.data.buffer)
    this.workingDepthBuffer = new Array(this.workingWidth * this.workingHeight)

    // pre calculate the index mapper
    this.quickOutputWorkingIndexMap = new Int32Array(this.outputWidth * this.outputHeight)
    const transRatio = 1 / this.outputWidth / this.pixelScale
    for (let i = 0; i < this.outputWidth * this.outputHeight; i++) {
      this.quickOutputWorkingIndexMap[ i ] = Math.floor(Math.floor(i * transRatio) * this.workingWidth + i % this.outputWidth / this.pixelScale)
    }
  }

  clearBuffer () {
    // clear the back buffer and the Z index
    const workingDepthBuffer = this.workingDepthBuffer
    const workingImageBufferData = this.workingImageBufferData
    for (let i = 0; i < workingDepthBuffer.length; i++) {
      workingDepthBuffer[ i ] = -Infinity // draw all
      workingImageBufferData[ i ] = 0 // reset rgba all to 0
    }
  }

  applyBuffer () {
    // TODO: Need Check: Uint8ClampedArray is only fond of 2 based size or ratio, or the indexing may be slow
    if (this.pixelScale === 1) {
      // directly
      this.canvasContext.putImageData(this.workingImageBuffer, 0, 0)
    } else {
      // TO PIXEL!!! re-sample the data for pixelScale(or the browser may blur it)
      const workingImageBufferData = this.workingImageBufferData
      const outputImageBufferData = this.outputImageBufferData
      const quickOutputWorkingIndexMap = this.quickOutputWorkingIndexMap
      for (let index = 0, loopCount = this.outputWidth * this.outputHeight; index < loopCount; index++) {
        outputImageBufferData[ index ] = workingImageBufferData[ quickOutputWorkingIndexMap[ index ] ]
      }
      this.canvasContext.putImageData(this.outputImageBuffer, 0, 0)
    }
  }

  putPixel (x, y, z, colorUint32) {
    x = Math.floor(x)
    y = Math.floor(y)

    // check out of buffer
    if (x < 0 || y < 0 || x >= this.workingWidth || y >= this.workingHeight) return

    // get index in data array
    let index = x + y * this.workingWidth

    // check depth for over lap
    if (z >= 0 || this.workingDepthBuffer[ index ] >= z) return

    this.workingDepthBuffer[ index ] = z
    this.workingImageBufferData[ index ] = colorUint32 // already considered systemEndianness
  }

  render (camera, { dataTreeRoot }) {
    // calculate View, Projection Matrix
    // process: Projection(3D->2D) * View(Camera) * World Matrix * Model Matrix * Model Vector --> Screen Vector
    const viewProjectionMatrix = camera.getViewProjectionMatrix()

    const BUFFER_VECTOR = new Vector3()
    const BUFFER_MATRIX = new Matrix4()
    const getMatrixApplyResult = (vector, matrix) => BUFFER_VECTOR.copy(vector).applyMatrix4(BUFFER_MATRIX)

    // render each node(PixelModel)
    dataTreeRoot.updateTransformMatrixWorld(false)
    dataTreeRoot.traverseDown((model) => {
      if (model.isVisible === false) return
      for (const namePixelPart in model.partMap) {
        const part = model.partMap[ namePixelPart ]
        if (part.isVisible === false) continue
        const partTransformMatrix = part.transformMatrix

        __calcTransformMatrix(BUFFER_MATRIX, partTransformMatrix, model.transformMatrixWorld, viewProjectionMatrix, camera.zoom)

        // draw PixelPixel
        part.pixels.forEach((pixelPixel) => {
          const { x, y, z } = getMatrixApplyResult(pixelPixel.position, BUFFER_MATRIX)
          this.putPixel( // check if out of screen or Hidden
            this.halfWorkingWidth + x,
            this.halfWorkingHeight - y, // canvas y+ is downward
            z,
            pixelPixel.color.getUint32()
          )
        })
      }
    })
  }

  // TODO: simple tracing by point, not ray yet
  rayTracing (camera, renderData, screenX, screenY, depth) {
    const rayOrigin = this.workingPositionFromOutput(screenX, screenY, depth)
    const rayDirection = new Vector3(0, 0, -1)
    const targetRay = new Ray3(rayOrigin, rayDirection)

    // calculate View, Projection Matrix
    // process: Projection(3D->2D) * View(Camera) * World Matrix * Model Matrix * Model Vector --> Screen Vector
    const viewProjectionMatrix = camera.getFocusViewProjectionMatrix()
    const BUFFER_VECTOR = new Vector3()
    const BUFFER_MATRIX = new Matrix4()

    // render each node(PixelModel or PixelMotion)
    const dataTreeRoot = renderData.dataTreeRoot
    dataTreeRoot.traverseDown(function (model) {
      if (model.isVisible === false) return

      const modelTransformMatrixWorld = model.transformMatrix
      const partMap = model.partMap
      for (const namePixelPart in partMap) {
        const part = partMap[ namePixelPart ]
        if (part.isVisible === false) continue
        const partTransformMatrix = part.transformMatrix

        // get inverted transform matrix
        __calcTransformMatrix(BUFFER_MATRIX, partTransformMatrix, modelTransformMatrixWorld, viewProjectionMatrix, camera.zoom)
        BUFFER_MATRIX.getInverse(BUFFER_MATRIX)

        // to local model space
        BUFFER_VECTOR.copy(rayOrigin)
        BUFFER_VECTOR.applyMatrix4(BUFFER_MATRIX)

        // check AABB
        if (targetRay.intersectsBox(part.aabb) === false) continue

        // draw PixelPixel
        const pixels = part.pixels
        for (let indexPixel = 0, indexPixelMax = pixels.length; indexPixel < indexPixelMax; indexPixel++) {
          const pixelPixel = pixels[ indexPixel ]

          const distanceSqrt = pixelPixel.position.distanceToSquared(BUFFER_VECTOR)
          if (distanceSqrt < 1) {
            return {
              minDistanceSqrt: distanceSqrt,
              node: model,
              part: part,
              pixel: pixelPixel
            }
          }
        }
      }
    })
  }

  rayTracingNearest (camera, renderData, screenX, screenY, depth) {
    const rayOrigin = this.workingPositionFromOutput(screenX, screenY, depth)
    // const rayDirection = new Vector3(0, 0, -1);
    // const targetRay = new Ray3(rayOrigin, rayDirection);

    const result = {
      minDistanceSqrt: Infinity,
      node: null,
      part: null,
      pixel: null
    }

    // calculate View, Projection Matrix
    // process: Projection(3D->2D) * View(Camera) * World Matrix * Model Matrix * Model Vector --> Screen Vector
    const viewProjectionMatrix = camera.getFocusViewProjectionMatrix()
    const BUFFER_VECTOR = new Vector3()
    const BUFFER_MATRIX = new Matrix4()

    // render each node(PixelModel or PixelMotion)
    const dataTreeRoot = renderData.dataTreeRoot
    dataTreeRoot.traverseDown(function (model) {
      if (model.isVisible === false) return

      const modelTransformMatrixWorld = model.transformMatrix
      const partMap = model.partMap
      for (const namePixelPart in partMap) {
        const part = partMap[ namePixelPart ]
        if (part.isVisible === false) continue

        const partTransformMatrix = part.transformMatrix

        // get inverted transform matrix
        __calcTransformMatrix(BUFFER_MATRIX, partTransformMatrix, modelTransformMatrixWorld, viewProjectionMatrix, camera.zoom)
        BUFFER_MATRIX.getInverse(BUFFER_MATRIX)

        // to local model space
        BUFFER_VECTOR.copy(rayOrigin)
        BUFFER_VECTOR.applyMatrix4(BUFFER_MATRIX)

        // draw PixelPixel
        const pixels = part.pixels
        for (let indexPixel = 0, indexPixelMax = pixels.length; indexPixel < indexPixelMax; indexPixel++) {
          const pixelPixel = pixels[ indexPixel ]

          const distanceSqrt = pixelPixel.position.distanceToSquared(BUFFER_VECTOR)
          if (distanceSqrt < result.minDistanceSqrt) {
            result.minDistanceSqrt = distanceSqrt
            result.node = model
            result.part = part
            result.pixel = pixelPixel
          }
        }
      }
    })

    return result
  }

  workingPositionFromOutput (screenX, screenY, depthZ, resultVector) {
    screenX = Math.round(screenX)
    screenY = Math.round(screenY)
    if (resultVector === undefined) resultVector = new Vector3()

    const outputIndex = screenY * this.outputWidth + screenX
    const workingIndex = this.quickOutputWorkingIndexMap[ outputIndex ]

    resultVector.set(workingIndex % this.workingWidth - this.halfWorkingWidth, this.halfWorkingHeight - Math.floor(workingIndex / this.workingWidth), depthZ)

    return resultVector
  }
}

function __resetCanvasSize (canvas, width, height) {
  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'
  canvas.width = width
  canvas.height = height
}

function __calcTransformMatrix (resultMatrix, partTransformMatrix, modelTransformMatrixWorld, viewProjectionMatrix, zoom) {
  // process: Projection(3D->2D) * View(Camera) * World Matrix * Model Matrix * Model Vector --> Screen Vector
  resultMatrix.multiplyMatrices(viewProjectionMatrix, modelTransformMatrixWorld)
  resultMatrix.multiplyMatrices(resultMatrix, partTransformMatrix)
  resultMatrix.multiplyScalar(zoom)
  return resultMatrix
}

export {
  PixelRender
}
