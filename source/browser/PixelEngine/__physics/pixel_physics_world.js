/**
 * Created by eames on 2016/4/7.
 */


Dr.Declare('PixelEngine.PixelPhysicsWorld', 'class');
Dr.Require('PixelEngine.PixelPhysicsWorld', 'PixelEngine.PixelPhysicsBody');
Dr.Require('PixelEngine.PixelPhysicsWorld', 'PixelEngine.PixelPhysicsShape');
Dr.Require('PixelEngine.PixelPhysicsWorld', 'Graphic.Vector3');
Dr.Require('PixelEngine.PixelPhysicsWorld', 'Data.TreeOct3Node');
Dr.Implement('PixelEngine.PixelPhysicsWorld', function (global, module_get) {

  const Vector3 = module_get('Graphic.Vector3');
  const TreeOct3Node = module_get('Data.TreeOct3Node');

  const PixelPhysicsWorld = function (gravity, options) {
    this.init(gravity, options);
  };

  PixelPhysicsWorld.prototype = {
    constructor: PixelPhysicsWorld,

    init: function (gravity, options) {
      this.gravity = gravity || new Vector3(0, 0, 0);

      this.options = {
        stepDelta: options.stepDelta || 0.016667, // ~60Hz
        stepMax: options.stepMax || 0.016667 * 8, // ~7.5Hz

        iterationVelocity: options.iterationVelocity || 10,
        iterationPosition: options.iterationPosition || 10,
      };

      this.stepTimeRemainder = 0; // remainder of last step

      this.bodyList = [];

      // speed up data
      this.collisionTree = new TreeOct3Node();

      // temp compute data
      this.contactList = []; //

    },

    clear: function () {
      //
    },

    step: function (deltaTime) {
      deltaTime = Math.min(deltaTime + this.stepTimeRemainder, this.options.stepMax);

      while (deltaTime >= this.options.stepDelta) {
        deltaTime -= this.options.stepDelta;

        // step once
        this.stepOnce();
      }

      this.stepTimeRemainder = deltaTime;
      return this.stepTimeRemainder;
    },

    stepOnce: function () {

      // Update contacts. This is where some contacts are destroyed.

      // {
      //   b2Timer timer;
      //   mContactManager.Collide();
      //   mProfile.collide = timer.GetMilliseconds();
      // }
      //
      // // Integrate velocities, solve velocity constraints, and integrate positions.
      // if (mStepComplete && step.dt > 0.0f)
      // {
      //   b2Timer timer;
      //   Solve(step);
      //   mProfile.solve = timer.GetMilliseconds();
      // }
      //
      // // Handle TOI events.
      // if (mContinuousPhysics && step.dt > 0.0f)
      // {
      //   b2Timer timer;
      //   SolveTOI(step);
      //   mProfile.solveTOI = timer.GetMilliseconds();
      // }
      //
      // if (step.dt > 0.0f)
      // {
      //   mInvDt0 = step.invDt;
      // }
      //
      // if (mFlags & eClearForces)
      // {
      //   ClearForces();
      // }


    },

    clearForce: function () {
      // clear force and torque after step, these value will be re-calculated in next step



    },

    addBody: function (body) {

    },
    removeBody: function (body) {

    },
  };

  return PixelPhysicsWorld;
});