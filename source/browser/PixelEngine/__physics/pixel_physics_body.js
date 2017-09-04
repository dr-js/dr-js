/**
 * Created by eames on 2016/4/7.
 *
 * Body: record Dynamics data
 *
 * static: do not move, no velocity, infinite mass
 * kinematic: move by velocity, do not respond to forces, infinite mass
 * dynamic: move by forces, set mass
 *
 */

Dr.Declare('PixelEngine.PixelPhysicsBody', 'class');
Dr.Require('PixelEngine.PixelPhysicsBody', 'Graphic.Vector3');
Dr.Require('PixelEngine.PixelPhysicsBody', 'Graphic.Quaternion');
Dr.Implement('PixelEngine.PixelPhysicsBody', function (global, module_get) {

  const Vector3 = module_get('Graphic.Vector3');
  const Quaternion = module_get('Graphic.Quaternion');

  const PixelPhysicsBody = function () {
    //
  };

  const BODY_TYPE = {
    STATIC: 'STATIC',
    KINEMATIC: 'KINEMATIC',
    DYNAMIC: 'DYNAMIC',
  };

  PixelPhysicsBody.prototype = {
    init: function (position, rotation, type) {
      this.position = position || new Vector3();
      this.rotation = rotation || new Quaternion();

      // data to describe the body

      this.type = type || BODY_TYPE.STATIC;

      this.mass = 0 // mass

      this.velocityLiner = new Vector3();
      this.force = new Vector3();

      this.velocity_angular = new Rotate4();
      this.torque = new Rotate4();

      this.gravityScale = 1;
    },
    clear: function () {
      //
    },
    update: function (deltaTime) {

    },
  };

  return PixelPhysicsBody;
});