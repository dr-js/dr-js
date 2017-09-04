/**
 * Created by gooma on 5/15/2016.
 *
 * maintain a list of spacial indexed tree of body, index using Z-order-curve
 *
 * each contact is related to 2 shape, not body
 * the contact list is stored here and in body
 *
 * for board phase
 *
 */

Dr.Declare('PixelEngine.PixelPhysicsContactCenter', 'class');
Dr.Require('PixelEngine.PixelPhysicsContactCenter', 'Graphic.Vector3');
Dr.Require('PixelEngine.PixelPhysicsContactCenter', 'Graphic.Box3');
Dr.Require('PixelEngine.PixelPhysicsContactCenter', 'Data.TreeOct3');
Dr.Require('PixelEngine.PixelPhysicsContactCenter', 'Data.ZOrderIndex16');
Dr.Require('PixelEngine.PixelPhysicsContactCenter', 'EventProto');
Dr.Implement('PixelEngine.PixelPhysicsContactCenter', function (global, module_get) {

  const EventProto = module_get('EventProto');
  const Vector3 = module_get('Graphic.Vector3');
  const Box3 = module_get('Graphic.Box3');
  const TreeOct3 = module_get('Data.TreeOct3');
  const ZOrderIndex16 = module_get('Data.ZOrderIndex16');

  const EVENT_TYPE = {
    CONTACT_START: 'CONTACT_START', // start of contact pair
    CONTACT_END: 'CONTACT_END', // end of contact pair
    SOLVE_BEFORE: 'SOLVE_BEFORE', // for cancel collusion
    SOLVE_AFTER: 'SOLVE_AFTER', // for result
  };

  const BLOCK_RADIUS = 16;
  const BLOCK_SIZE = Math.pow(BLOCK_RADIUS, 3);
  const CHUNK_RADIUS = 64 * BLOCK_RADIUS;
  const CHUNK_SIZE = Math.pow(CHUNK_RADIUS, 3);


  const PixelPhysicsContactCenter = function () {
    // ... - node - node - treeoct3(64x64x64)
    this.octree = new TreeOct3(Dr.generateId(), new Vector3(0, 0, 0), 64);

    this.eventCenter = new EventProto();

    this.treeHash = []; // z order index - octree
    this.boundBox = new Box3(); // current sum of chunk size
    this.stuckDataList = [];

    this.contactList = []; // cached pairs of data that AABB intersects
    this.changedDataMap = {}; // marked data will need to update their contact
  };

  PixelPhysicsContactCenter.prototype = {
    constructor: PixelPhysicsContactCenter,

    clear: function () {

    },

    update: function () {
      const changedDataMap = this.changedDataMap;
      this.changedDataMap = {};
      for (const id in changedDataMap) {
        const data = changedDataMap[id];

        data.update();

      }
    },

    addShape: function (shape) {
      const data = new TreeOct3Data(shape);
      this.octree.addData(data);
      this.changedDataMap[data.id] = data;
    },
    removeShape: function (shape) {
      const data = shape._collusionData;
      if (data === undefined) {
        throw new Error('[removeShape] missing shape._collusionData');
      }
      this.octree.removeData(data);
      delete this.changedDataMap[data.id];
      shape._collusionData = undefined;

      // remove from this.contactList
      data.isValid = false;
    },





    getBoxIndex: function (box) {
      if (this.boundBox.containsBox(box) === true) {
        const x = Math.floor(box.min.x / CHUNK_RADIUS);
        const y = Math.floor(box.min.y / CHUNK_RADIUS);
        const chunkIndex = ZOrderIndex16.parseXY(x, y);
        return chunkIndex; // maybe  fit in this chunk
      }
      else {
        return -1; // stuck
      }
    },

    loadChunk: function (x, y) {
      x = Math.floor(x / CHUNK_RADIUS);
      y = Math.floor(y / CHUNK_RADIUS);

      const chunkIndex = ZOrderIndex16.parseXY(x, y);

      if (this.treeHash[chunkIndex]) {
        this.treeHash[chunkIndex] = new TreeOct3(Dr.generateId(), new Vector3(x, y, 0), CHUNK_RADIUS);

        // load process, load trunk data for static blocks?
        // load process
        // load process
        // load process

      }
      return chunkIndex;
    },
    unloadChunk: function (chunkIndex) {
      if (this.treeHash[chunkIndex] !== undefined) {

        // clear process, remove static blocks?
        // clear process
        // clear process
        // clear process

        delete this.treeHash[chunkIndex];
      }
    },
  };


  const TreeOct3Data = function (shape) {
    this.shape = shape;
    this.isChanged = true; // used to check contact change[add or remove], new data will always need check
    shape._collusionData = this; // link to shape

    const body = shape.body;
    this.contactList = body.contactList; // per body contact

    this.id = shape.id;
    this.box = new Box3(); // in world space

    // mark data for octree
    this._oct3node = null;
    this._octantIndex = -1;
  };

  TreeOct3Data.prototype = {
    constructor: TreeOct3Data,

    update: function () {
      // sync box min max
      if (this.isChanged === true)
        this.shape.getAABB(this.box);
    },

  };


  return PixelPhysicsContactCenter;
});