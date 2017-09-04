/**
 * Created by eames on 2016/4/7.
 *
 * Shape: record Collision data
 *
 * Definition:
 *   Shape always wrapped in a Body,  Body can consist of multiple Shapes
 *   Shape position is only offset relative to the Body
 *
 * for ths engine, there's 2 type of shape:
 *
 */

Dr.Declare('PixelEngine.PixelPhysicsShape', 'class');
Dr.Require('PixelEngine.PixelPhysicsShape', 'Graphic.Vector3');
Dr.Require('PixelEngine.PixelPhysicsShape', 'Graphic.Quaternion');
Dr.Require('PixelEngine.PixelPhysicsShape', 'Graphic.Matrix4');
Dr.Implement('PixelEngine.PixelPhysicsShape', function (global, module_get) {

  const Vector3 = module_get('Graphic.Vector3');
  const Quaternion = module_get('Graphic.Quaternion');
  const Matrix4 = module_get('Graphic.Matrix4');

  const PixelPhysicsShape = function () {
    //
  };

  const SHAPE_TYPE = {
    // SPHERE: 'SPHERE',
    // ELLIPSOID: 'ELLIPSOID',
    //
    // CUBE: 'CUBE',
    // CUBOID: 'CUBOID',
    //
    // CHAIN: 'CHAIN',
    // PLANE: 'PLANE',

    BOX: 'BOX', // less detail
    MODEL: 'MODEL', // more detail, from model pixels
  };

  PixelPhysicsShape.prototype = {
    init: function (position, rotation, type) {
      // all is local, relative to body
      this.position = position || new Vector3();
      this.rotation = rotation || new Quaternion();

      // data to describe the shape
      this.type = type || SHAPE_TYPE.BOX;

      this.body = null;

      this.transformMatrix = new Matrix4();
      //
    },

    clear: function () {
      //
    },

    update: function (deltaTime) {

    },

    // transformMatrix provide local position to world position transform
    getAABB: function (box) {
      box.set(
        min, max
      );
    },
    ComputeMass: function (density) {
      return 0;
    },
    pointTest: function (point, hitCallback) {

    },
    rayTest: function (ray, hitCallback) {

    },
  };

  return PixelPhysicsShape;
});